import { SparkleRegular } from "@fluentui/react-icons";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IChatMessage } from "../../AIAssistant.types";
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

	// Only offer renderMessage for assistant messages that carry a normalized payload.
	// Payload is pre-computed at entry points (adapter / history load) — no parsing here.
	const hasPayload = message.role === "assistant" && !!message.data?.payload;
	const renderResult = hasPayload ? renderMessage?.(message) : undefined;
	const customContent =
		renderResult !== null &&
		renderResult !== undefined &&
		renderResult !== false
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

	const html = resolvedHtml;

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
					{message.content || <RawDataFallback message={message} />}
				</div>
			)}
		</div>
	);
};

const RawDataFallback = ({ message }: { message: IChatMessage }) => {
	const payload = message.data?.payload;
	if (!payload) return null;
	const classes = useChatMessageBubbleStyles();
	return (
		<div>
			<p className={classes.rawDataLabel}>
				No template available. Showing raw data:
			</p>
			<pre className={classes.rawDataPre}>{payload}</pre>
		</div>
	);
};
