import { SparkleRegular } from "@fluentui/react-icons";
import { useChatMessageBubbleStyles } from "./ChatMessageBubble.styles";
import { formatTime } from "./ChatMessageBubble.utils";
import type { IChatMessageBubbleProps } from "./ChatMessageBubble.types";
import { IsolatedHtmlRenderer } from "./IsolatedHtmlRenderer";
import { useResolveMessage } from "./useResolveMessage";
import { useAIAssistantContext } from "../../AIAssistantContext";

export const ChatMessageBubble = ({
	message,
	renderMessage,
}: IChatMessageBubbleProps) => {
	const classes = useChatMessageBubbleStyles();
	const { service } = useAIAssistantContext();
	const customContent = renderMessage?.(message);
	const { resolvedHtml, isLoading } = useResolveMessage(
		message,
		service,
		!!customContent,
	);

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
				<div className={classes.assistantBubble} style={{ width: "calc(100% - 40px)" }}>
					<div className={classes.skeletonLine} style={{ width: "100%" }} />
					<div className={classes.skeletonLine} style={{ width: "75%" }} />
					<div className={classes.skeletonLine} style={{ width: "50%" }} />
				</div>
			) : html ? (
				<div className={classes.assistantCard}>
					<IsolatedHtmlRenderer html={html} />
				</div>
			) : (
				<div className={classes.assistantBubble}>{message.content}</div>
			)}
		</div>
	);
};
