import { mergeClasses } from "@fluentui/react-components";
import { SparkleRegular } from "@fluentui/react-icons";
import { ChatMessageBubble } from "./chat-message-bubble";
import { useChatMessageBubbleStyles, formatTime } from "./chat-message-bubble";
import { useAutoScroll } from "./useAutoScroll";
import { useChatAreaStyles } from "./ChatArea.styles";
import { LazyMessage } from "./LazyMessage";
import type { IChatAreaProps } from "./ChatArea.types";

const TYPING_DOT_CLASSES = ["typingDot1", "typingDot2", "typingDot3"] as const;

export const ChatArea = ({
	messages,
	isStreaming,
	streamingText,
	renderMessage,
}: IChatAreaProps) => {
	const classes = useChatAreaStyles();
	const msgClasses = useChatMessageBubbleStyles();
	const { scrollRef } = useAutoScroll(messages.length);

	const eagerThreshold = messages.length - 6;

	return (
		<div ref={scrollRef} className={classes.thread}>
			{messages.map((message, index) => (
				<LazyMessage
					key={message.id}
					estimatedHeight={message.role === "user" ? 60 : 150}
					eager={index >= eagerThreshold}
				>
					<ChatMessageBubble
						message={message}
						renderMessage={renderMessage}
					/>
				</LazyMessage>
			))}
			{isStreaming && (
				<div className={msgClasses.assistantBlock}>
					<div className={msgClasses.assistantPreamble}>
						<span className={msgClasses.avatar}>
							<SparkleRegular fontSize={18} />
						</span>
						{streamingText ? (
							<span>{formatTime(new Date().toISOString())}</span>
						) : (
							<div className={classes.typingIndicator}>
								{TYPING_DOT_CLASSES.map((cls) => (
									<span
										key={cls}
										className={mergeClasses(classes.typingDot, classes[cls])}
									/>
								))}
							</div>
						)}
					</div>
					{streamingText && (
						<div className={msgClasses.assistantBubble}>{streamingText}</div>
					)}
				</div>
			)}
		</div>
	);
};
