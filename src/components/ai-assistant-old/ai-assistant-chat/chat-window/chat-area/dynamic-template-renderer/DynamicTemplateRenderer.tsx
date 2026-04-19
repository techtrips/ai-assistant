import { useEffect, useMemo, useState, type ComponentType } from "react";
import { SparkleRegular } from "@fluentui/react-icons";
import {
	CANCELLED_MESSAGE,
	extractCustomPrompt,
	extractDisplayText,
	parseStructuredPayload,
} from "../../../../AIAssistant.utils";
import { formatMessageTime } from "../../../AIAssistantChat.utils";
import { IDynamicTemplateRendererProps } from "./DynamicTemplateRenderer.models";
import { useDynamicTemplateRendererStyles } from "./DynamicTemplateRenderer.styles";
import { IsolatedHtmlRenderer } from "../IsolatedHtmlRenderer";

const isNonArrayObject = (val: unknown): val is Record<string, unknown> =>
	typeof val === "object" && val !== null && !Array.isArray(val);

export const DynamicTemplateRenderer = (
	props: IDynamicTemplateRendererProps,
) => {
	const { getTemplate, message, userMessageText, renderDynamicTemplate } =
		props;
	const classes = useDynamicTemplateRendererStyles();
	const [generatedHtml, setGeneratedHtml] = useState<string>();

	const parsedSerialized = useMemo(() => {
		if (!message.serializedMessage) return undefined;
		try {
			const parsed = JSON.parse(message.serializedMessage);
			return isNonArrayObject(parsed) ? parsed : undefined;
		} catch {
			return undefined;
		}
	}, [message.serializedMessage]);

	const preGeneratedHtml = useMemo(() => {
		if (typeof parsedSerialized?.__generatedHtml === "string") {
			return parsedSerialized.__generatedHtml;
		}
		return undefined;
	}, [parsedSerialized]);

	const payload = useMemo(() => {
		if (!message.serializedMessage) {
			return parseStructuredPayload(message.messageText);
		}
		if (parsedSerialized?.__payload) {
			return parsedSerialized.__payload;
		}
		return (
			parseStructuredPayload(message.serializedMessage) ??
			parseStructuredPayload(message.messageText)
		);
	}, [message.messageText, message.serializedMessage, parsedSerialized]);

	const displayText = useMemo(
		() => extractDisplayText(message, payload),
		[message, payload],
	);

	const { templateId, templateData } = useMemo(() => {
		if (!isNonArrayObject(payload)) {
			return {
				templateId: undefined,
				templateData: {} as Record<string, unknown>,
			};
		}
		const id = payload.templateId ?? payload.TemplateId ?? payload.template_id;
		const data = (
			isNonArrayObject(payload.data) ? payload.data : payload
		) as Record<string, unknown>;
		return {
			templateId: id != null ? String(id) : undefined,
			templateData: data,
		};
	}, [payload]);

	const TemplateComponent = useMemo(() => {
		if (!templateId) return undefined;
		return getTemplate?.({ templateId, data: templateData }) as
			| ComponentType<{ data: Record<string, unknown> }>
			| undefined;
	}, [getTemplate, templateId, templateData]);

	const customPrompt = useMemo(() => extractCustomPrompt(payload), [payload]);

	const isCancelled = displayText === CANCELLED_MESSAGE;
	const effectiveHtml = preGeneratedHtml ?? generatedHtml;
	const shouldGenerateDynamicUi =
		!isCancelled &&
		!TemplateComponent &&
		!preGeneratedHtml &&
		payload !== undefined;

	useEffect(() => {
		if (!shouldGenerateDynamicUi || !renderDynamicTemplate) {
			setGeneratedHtml(undefined);
			return;
		}

		let disposed = false;
		const abortController = new AbortController();

		void renderDynamicTemplate(
			userMessageText,
			payload,
			customPrompt,
			abortController.signal,
		)
			.then((html) => {
				if (!disposed) {
					setGeneratedHtml(html);
				}
			})
			.catch((error) => {
				if (!abortController.signal.aborted) {
					console.error("[AIAssistant] Failed to generate dynamic UI.", error);
				}
			});

		return () => {
			disposed = true;
			abortController.abort();
		};
	}, [
		customPrompt,
		payload,
		renderDynamicTemplate,
		shouldGenerateDynamicUi,
		userMessageText,
	]);

	return (
		<div className={classes.assistantBlock}>
			<div className={classes.assistantPreamble}>
				<span className={classes.avatar}>
					<SparkleRegular fontSize={18} />
				</span>
				<span>{formatMessageTime(message.timestamp)}</span>
			</div>

			{isCancelled ? (
				<span className={classes.cancelledMessage}>{displayText}</span>
			) : TemplateComponent ? (
				<div className={classes.assistantCard}>
					<div className={classes.localAssistantRichContent}>
						<TemplateComponent data={templateData} />
					</div>
				</div>
			) : effectiveHtml ? (
				<div className={classes.assistantCard}>
					<IsolatedHtmlRenderer
						className={classes.generatedAssistantHtml}
						html={effectiveHtml}
					/>
				</div>
			) : (
				<div className={classes.localAssistantBubble}>{displayText}</div>
			)}
		</div>
	);
};
