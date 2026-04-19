import { useCallback, useMemo, useState } from "react";
import { Skeleton, SkeletonItem } from "@fluentui/react-components";
import {
	SparkleRegular,
	CopyRegular,
	CheckmarkRegular,
} from "@fluentui/react-icons";
import {
	CANCELLED_MESSAGE,
	extractDisplayText,
	parseSerializedMessage,
} from "../../../../AIAssistant.utils";
import { formatMessageTime } from "../../../AIAssistantChat.utils";
import { IMessageRendererProps } from "./MessageRenderer.models";
import { useMessageRendererStyles } from "./MessageRenderer.styles";
import { useResolveTemplate } from "./useResolveTemplate";
import { IsolatedHtmlRenderer } from "../IsolatedHtmlRenderer";

export const MessageRenderer = (props: IMessageRendererProps) => {
	const {
		message,
		userMessageText,
		resolveTemplate,
		cachedResolved,
		onResolved,
	} = props;
	const classes = useMessageRendererStyles();

	const { preGeneratedHtml, payload } = useMemo(
		() => parseSerializedMessage(message),
		[message],
	);

	const displayText = useMemo(
		() => extractDisplayText(message, payload),
		[message, payload],
	);

	const isCancelled = displayText === CANCELLED_MESSAGE;

	const formattedJson = useMemo(() => {
		if (!displayText) return undefined;
		try {
			const parsed = JSON.parse(displayText);
			return JSON.stringify(parsed, null, 2);
		} catch {
			return undefined;
		}
	}, [displayText]);

	const [copied, setCopied] = useState(false);
	const handleCopy = useCallback(() => {
		const text = formattedJson ?? displayText;
		void navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [formattedJson, displayText]);

	const { resolved, isLoading, templateData } = useResolveTemplate({
		messageId: message.id,
		payload,
		userMessageText,
		resolveTemplate,
		skip: isCancelled || !!preGeneratedHtml || payload === undefined,
		cachedResolved,
		onResolved,
	});

	const effectiveHtml =
		preGeneratedHtml ?? (resolved?.type === "html" ? resolved.html : undefined);
	const {
		component: ResolvedComponent,
		data: resolvedData,
		onAction: resolvedOnAction,
	} = resolved?.type === "component"
		? resolved
		: { component: undefined, data: templateData, onAction: undefined };

	return (
		<div className={classes.assistantBlock}>
			<div className={classes.assistantPreamble}>
				<span className={classes.avatar}>
					<SparkleRegular fontSize={18} />
				</span>
				<span>{formatMessageTime(message.timestamp)}</span>
			</div>

			{isLoading ? (
				<div className={classes.assistantCard}>
					<Skeleton animation="pulse">
						<div className={classes.shimmerColumn}>
							<SkeletonItem size={16} style={{ width: "40%" }} />
							<SkeletonItem size={12} style={{ width: "90%" }} />
							<SkeletonItem size={12} style={{ width: "75%" }} />
							<SkeletonItem size={12} style={{ width: "60%" }} />
							<div className={classes.shimmerRow}>
								<SkeletonItem size={32} style={{ width: "30%" }} />
								<SkeletonItem size={32} style={{ width: "30%" }} />
								<SkeletonItem size={32} style={{ width: "30%" }} />
							</div>
						</div>
					</Skeleton>
				</div>
			) : isCancelled ? (
				<span className={classes.cancelledMessage}>{displayText}</span>
			) : ResolvedComponent ? (
				<div className={classes.assistantCard}>
					<div className={classes.localAssistantRichContent}>
						<ResolvedComponent
							data={resolvedData}
							onAction={resolvedOnAction}
						/>
					</div>
				</div>
			) : effectiveHtml ? (
				<div className={classes.assistantCard}>
					<IsolatedHtmlRenderer
						className={classes.generatedAssistantHtml}
						html={effectiveHtml}
					/>
				</div>
			) : formattedJson ? (
				<div className={classes.rawJsonCard}>
					<div className={classes.rawJsonHeader}>
						<span>JSON</span>
						<button
							type="button"
							className={classes.rawJsonCopyButton}
							onClick={handleCopy}
						>
							{copied ? (
								<>
									<CheckmarkRegular fontSize={12} /> Copied
								</>
							) : (
								<>
									<CopyRegular fontSize={12} /> Copy
								</>
							)}
						</button>
					</div>
					<pre className={classes.rawJsonPre}>{formattedJson}</pre>
				</div>
			) : (
				<div className={classes.localAssistantBubble}>{displayText}</div>
			)}
		</div>
	);
};
