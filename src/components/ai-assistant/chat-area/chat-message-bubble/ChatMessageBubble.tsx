import { mergeClasses } from "@fluentui/react-components";
import { SparkleRegular } from "@fluentui/react-icons";
import { memo } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IChatMessage } from "../../AIAssistant.types";
import { ActivityDetails } from "./ActivityDetails";
import { useChatMessageBubbleStyles } from "./ChatMessageBubble.styles";
import type { IChatMessageBubbleProps } from "./ChatMessageBubble.types";
import { formatTime } from "./ChatMessageBubble.utils";
import { CopyMessageButton } from "./CopyMessageButton";
import { IsolatedHtmlRenderer } from "./IsolatedHtmlRenderer";
import { useResolveMessage } from "./useResolveMessage";

const ChatMessageBubbleImpl = ({ message }: IChatMessageBubbleProps) => {
	const classes = useChatMessageBubbleStyles();
	const { service, theme, settings, messageRenderers } =
		useAIAssistantContext();
	const { resolved, isLoading } = useResolveMessage(
		message,
		service,
		theme,
		settings,
		messageRenderers,
	);

	if (message.role === "user") {
		return (
			<div className={mergeClasses(classes.userBlock, classes.userHover)}>
				<span className={classes.userTime}>
					{formatTime(message.timestamp)}
				</span>
				<div className={classes.userBubble}>{message.content}</div>
				<CopyMessageButton
					message={message}
					className={mergeClasses(classes.copyButton, classes.copyButtonUser)}
				/>
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

	const isHtml = typeof resolved === "string";

	return (
		<div
			className={mergeClasses(classes.assistantBlock, classes.assistantHover)}
		>
			<div className={classes.assistantPreamble}>
				<span className={classes.avatar}>
					<SparkleRegular fontSize={18} />
				</span>
				{!isLoading &&
				settings?.showAgentActivity &&
				message.data?.activities?.length ? (
					<ActivityDetails activities={message.data.activities} inline />
				) : null}
				<span className={classes.assistantPreambleTime}>
					{formatTime(message.timestamp)}
				</span>
			</div>
			{isLoading ? (
				<>
					<div
						className={classes.assistantBubble}
						style={{ width: "calc(100% - 40px)" }}
					>
						<div className={classes.skeletonLine} style={{ width: "100%" }} />
						<div className={classes.skeletonLine} style={{ width: "75%" }} />
						<div className={classes.skeletonLine} style={{ width: "50%" }} />
					</div>
					{settings?.showAgentActivity && message.data?.activities?.length ? (
						<ActivityDetails
							activities={message.data.activities}
							progressLabel={
								message.data.activities[message.data.activities.length - 1]
									.label
							}
						/>
					) : null}
				</>
			) : isHtml ? (
				<div className={classes.assistantCard}>
					<IsolatedHtmlRenderer html={resolved} theme={theme} />
				</div>
			) : resolved ? (
				<div className={classes.assistantCard}>{resolved}</div>
			) : (
				<div className={classes.assistantBubble}>
					{message.content || <RawDataFallback message={message} />}
				</div>
			)}
			{!isLoading && (
				<CopyMessageButton
					message={message}
					className={mergeClasses(
						classes.copyButton,
						classes.copyButtonAssistant,
					)}
				/>
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

/**
 * Equality predicate for `React.memo`. Re-render only when the message
 * identity, mutable streaming fields (`content`), or the structured data
 * payload reference change. The chat list re-renders on every parent
 * state change (active stream tick, settings update); without this guard
 * every existing bubble would re-resolve and re-render.
 */
const areMessagePropsEqual = (
	prev: IChatMessageBubbleProps,
	next: IChatMessageBubbleProps,
): boolean => {
	const a = prev.message;
	const b = next.message;
	return (
		a.id === b.id &&
		a.role === b.role &&
		a.content === b.content &&
		a.data === b.data
	);
};

export const ChatMessageBubble = memo(
	ChatMessageBubbleImpl,
	areMessagePropsEqual,
);
