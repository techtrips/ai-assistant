import { useEffect, useMemo } from "react";
import {
	mergeClasses,
	Skeleton,
	SkeletonItem,
} from "@fluentui/react-components";
import { SparkleRegular } from "@fluentui/react-icons";
import { IChatAreaProps } from "./ChatArea.models";
import { MessageRenderer } from "./message-renderer/MessageRenderer";
import { useAIAssistantChatStyles } from "../../AIAssistantChat.styles";
import { formatMessageTime } from "../../AIAssistantChat.utils";
import { useTemplateCache } from "./useTemplateCache";
import { useAutoScroll } from "./useAutoScroll";
import { LazyMessage } from "./LazyMessage";

const TYPING_DOT_CLASSES = ["typingDot1", "typingDot2", "typingDot3"] as const;

export const ChatArea = (props: IChatAreaProps) => {
	const {
		activeConversation,
		messages,
		isDeveloperMode,
		isAguiInProgress,
		aguiRawData,
		resolveTemplate,
	} = props;

	const classes = useAIAssistantChatStyles();
	const messageItems = messages?.data ?? [];

	const templateCache = useTemplateCache();

	// Clear template cache when conversation changes
	useEffect(() => {
		templateCache.clear();
	}, [activeConversation?.id]);

	const { scrollRef } = useAutoScroll(messageItems.length);

	const latestUserTextByIndex = useMemo(() => {
		const map = new Map<number, string | undefined>();
		let latestUserText: string | undefined;
		for (let i = 0; i < messageItems.length; i++) {
			if (messageItems[i].role === "user") {
				latestUserText = messageItems[i].messageText;
			}
			map.set(i, latestUserText);
		}
		return map;
	}, [messageItems]);

	if (!activeConversation) {
		return null;
	}

	if (messages?.loading && (messages.data?.length ?? 0) === 0) {
		return (
			<div className={classes.thread}>
				<Skeleton animation="pulse">
					<div className={classes.userBlock}>
						<SkeletonItem size={12} style={{ width: "60px" }} />
						<SkeletonItem
							size={36}
							style={{ width: "45%", alignSelf: "flex-end" }}
						/>
					</div>
					<div className={classes.assistantBlock}>
						<SkeletonItem shape="circle" size={28} />
						<SkeletonItem size={48} style={{ width: "70%" }} />
					</div>
					<div className={classes.userBlock}>
						<SkeletonItem size={12} style={{ width: "60px" }} />
						<SkeletonItem
							size={28}
							style={{ width: "35%", alignSelf: "flex-end" }}
						/>
					</div>
					<div className={classes.assistantBlock}>
						<SkeletonItem shape="circle" size={28} />
						<SkeletonItem size={64} style={{ width: "60%" }} />
					</div>
				</Skeleton>
			</div>
		);
	}

	if (messages?.error && (messages.data?.length ?? 0) === 0) {
		return (
			<div className={classes.thread}>
				<div className={classes.assistantBlock}>
					<div className={classes.assistantPreamble}>
						<span className={classes.avatar}>
							<SparkleRegular fontSize={18} />
						</span>
						<span
							style={{
								color: "var(--colorPaletteRedForeground1, #c4314b)",
								fontSize: "0.88rem",
							}}
						>
							Something went wrong. Please try again later.
						</span>
					</div>
				</div>
			</div>
		);
	}

	const hasInlineError = !!messages?.error && (messages.data?.length ?? 0) > 0;

	const eagerThreshold = messageItems.length - 6;

	return (
		<div ref={scrollRef} className={classes.thread}>
			{messageItems.map((message, index) => {
				const isEager = index >= eagerThreshold;

				if (message.role === "user") {
					return (
						<LazyMessage
							key={`${message.id ?? "msg"}-${index}`}
							className={classes.messageItem}
							estimatedHeight={60}
							eager={isEager}
						>
							<div className={classes.userBlock}>
								<span className={classes.userTime}>
									{formatMessageTime(message.timestamp)}
								</span>
								<div className={classes.userBubble}>{message.messageText}</div>
							</div>
						</LazyMessage>
					);
				}

				return (
					<LazyMessage
						key={`${message.id ?? "msg"}-${index}`}
						className={classes.messageItem}
						estimatedHeight={150}
						eager={isEager}
					>
						<MessageRenderer
							message={message}
							userMessageText={latestUserTextByIndex.get(index)}
							resolveTemplate={resolveTemplate}
							cachedResolved={
								message.id ? templateCache.get(message.id) : undefined
							}
							onResolved={templateCache.onResolved}
						/>
					</LazyMessage>
				);
			})}

			{hasInlineError && !isAguiInProgress && (
				<div className={classes.assistantBlock}>
					<div className={classes.assistantPreamble}>
						<span className={classes.avatar}>
							<SparkleRegular fontSize={18} />
						</span>
						<span
							style={{
								color: "var(--colorPaletteRedForeground1, #c4314b)",
								fontSize: "0.88rem",
							}}
						>
							Something went wrong. Please try again.
						</span>
					</div>
				</div>
			)}

			{isAguiInProgress && (
				<div className={classes.assistantBlock}>
					<div className={classes.assistantPreamble}>
						<span className={classes.avatar}>
							<SparkleRegular fontSize={18} />
						</span>
						{isDeveloperMode ? (
							<span className={classes.devModeLabel}>RAW OUTPUT</span>
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
					{isDeveloperMode && (
						<div className={classes.localAssistantBubble}>
							<pre className={classes.rawOutput}>
								{aguiRawData || "Waiting for response..."}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
