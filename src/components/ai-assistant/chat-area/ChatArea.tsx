import { useCallback, useEffect, useRef } from "react";
import { mergeClasses } from "@fluentui/react-components";
import { SparkleRegular } from "@fluentui/react-icons";
import { ChatMessageBubble } from "./chat-message-bubble";
import { useChatMessageBubbleStyles, formatTime } from "./chat-message-bubble";
import { useAutoScroll } from "./useAutoScroll";
import { useChatAreaStyles } from "./ChatArea.styles";
import { LazyMessage } from "./LazyMessage";
import type { IChatAreaProps } from "./ChatArea.types";

const TYPING_DOT_CLASSES = ["typingDot1", "typingDot2", "typingDot3"] as const;
const LOAD_MORE_THRESHOLD = 80;

export const ChatArea = ({
	messages,
	isStreaming,
	streamingText,
	totalMessageCount = 0,
	onLoadMore,
}: IChatAreaProps) => {
	const classes = useChatAreaStyles();
	const msgClasses = useChatMessageBubbleStyles();
	const { scrollRef } = useAutoScroll(messages.length, isStreaming);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const prevScrollHeightRef = useRef(0);

	const hasMore = messages.length < totalMessageCount;
	const eagerThreshold = messages.length - 6;

	// Restore scroll position after prepending older messages
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs on messages change to adjust scroll after prepend
	useEffect(() => {
		const el = containerRef.current;
		if (!el || prevScrollHeightRef.current === 0) return;
		const newScrollHeight = el.scrollHeight;
		const delta = newScrollHeight - prevScrollHeightRef.current;
		if (delta > 0) {
			el.scrollTop += delta;
		}
		prevScrollHeightRef.current = 0;
	}, [messages]);

	const handleScroll = useCallback(() => {
		const el = containerRef.current;
		if (!el || !hasMore || !onLoadMore) return;
		if (el.scrollTop <= LOAD_MORE_THRESHOLD) {
			prevScrollHeightRef.current = el.scrollHeight;
			onLoadMore();
		}
	}, [hasMore, onLoadMore]);

	const combinedRef = useCallback(
		(el: HTMLDivElement | null) => {
			containerRef.current = el;
			scrollRef(el);
		},
		[scrollRef],
	);

	return (
		<div ref={combinedRef} className={classes.thread} onScroll={handleScroll}>
			{messages.map((message, index) => (
				<LazyMessage
					key={message.id}
					estimatedHeight={message.role === "user" ? 60 : 150}
					eager={index >= eagerThreshold}
				>
					<ChatMessageBubble message={message} />
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
