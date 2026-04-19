import { SparkleRegular } from "@fluentui/react-icons";
import { useAIAssistantContext } from "../../AIAssistantContext";
import { extractToolPayload } from "../../AIAssistant.utils";
import { useChatMessageBubbleStyles } from "./ChatMessageBubble.styles";
import type { IChatMessageBubbleProps } from "./ChatMessageBubble.types";
import { formatTime } from "./ChatMessageBubble.utils";
import { IsolatedHtmlRenderer } from "./IsolatedHtmlRenderer";
import { useResolveMessage } from "./useResolveMessage";

export const ChatMessageBubble = ({
	message,
	renderMessage,
}: IChatMessageBubbleProps) => {
	const classes = useChatMessageBubbleStyles();
	const { service, theme, settings } = useAIAssistantContext();
	const { resolvedHtml, isLoading } = useResolveMessage(
		message,
		service,
		theme,
		settings,
	);

	// Only offer renderMessage for assistant messages with agent data (tool calls).
	// If renderMessage returns null/undefined/false, fall through to the resolution pipeline.
	const hasAgentData = message.role === "assistant" && !!message.data?.toolCalls;
	const renderResult = hasAgentData ? renderMessage?.(message) : undefined;
	const customContent =
		renderResult !== null && renderResult !== undefined && renderResult !== false
			? renderResult
			: undefined;

	if (message.role === "user") {
		return (
			<div className={classes.userBlock}>
				<span className={classes.userTime}>
					{formatTime(message.timestamp)}
				</span>
				<div className={classes.userBubble}>{message.content}</div>
			</div>
		);
	}

	if (message.role === "error") {
		return (
			<div className={classes.assistantBlock}>
				<div className={classes.assistantPreamble}>
					<span className={classes.avatar}>
						<SparkleRegular fontSize={18} />
					</span>
					<span className={classes.errorText}>
						Something went wrong. Please try again.
					</span>
				</div>
			</div>
		);
	}

	const resolvedHtmlFromData = message.data?.__resolvedHtml as
		| string
		| undefined;
	const html = resolvedHtml ?? resolvedHtmlFromData;

	return (
		<div className={classes.assistantBlock}>
			<div className={classes.assistantPreamble}>
				<span className={classes.avatar}>
					<SparkleRegular fontSize={18} />
				</span>
				<span>{formatTime(message.timestamp)}</span>
			</div>
			{customContent ? (
				<div className={classes.assistantCard}>{customContent}</div>
			) : isLoading ? (
				<div
					className={classes.assistantBubble}
					style={{ width: "calc(100% - 40px)" }}
				>
					<div className={classes.skeletonLine} style={{ width: "100%" }} />
					<div className={classes.skeletonLine} style={{ width: "75%" }} />
					<div className={classes.skeletonLine} style={{ width: "50%" }} />
				</div>
			) : html ? (
				<div className={classes.assistantCard}>
					<IsolatedHtmlRenderer html={html} theme={theme} />
				</div>
			) : (
				<div className={classes.assistantBubble}>
					{message.content || (
						<RawDataFallback data={message.data} />
					)}
				</div>
			)}
		</div>
	);
};

const RawDataFallback = ({ data }: { data?: Record<string, unknown> }) => {
	if (!data) return null;
	const payload = extractToolPayload(data);
	if (!payload) return null;
	const json =
		typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
	return (
		<div>
			<p style={{ margin: "0 0 8px", fontSize: "12px", opacity: 0.7, fontStyle: "italic" }}>
				No template available. Showing raw data:
			</p>
			<pre style={{ fontFamily: "inherit", fontSize: "13px", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, background: "rgba(128,128,128,0.08)", padding: "10px", borderRadius: "6px" }}>
				{json}
			</pre>
		</div>
	);
};
