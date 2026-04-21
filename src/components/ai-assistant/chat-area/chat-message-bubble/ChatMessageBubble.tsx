import { SparkleRegular } from "@fluentui/react-icons";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IChatMessage } from "../../AIAssistant.types";
import { useChatMessageBubbleStyles } from "./ChatMessageBubble.styles";
import type { IChatMessageBubbleProps } from "./ChatMessageBubble.types";
import { formatTime } from "./ChatMessageBubble.utils";
import { IsolatedHtmlRenderer } from "./IsolatedHtmlRenderer";
import { useResolveMessage } from "./useResolveMessage";

export const ChatMessageBubble = ({ message }: IChatMessageBubbleProps) => {
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

	const isHtml = typeof resolved === "string";

	return (
		<div className={classes.assistantBlock}>
			<div className={classes.assistantPreamble}>
				<span className={classes.avatar}>
					<SparkleRegular fontSize={18} />
				</span>
				<span>{formatTime(message.timestamp)}</span>
			</div>
			{isLoading ? (
				<div
					className={classes.assistantBubble}
					style={{ width: "calc(100% - 40px)" }}
				>
					<div className={classes.skeletonLine} style={{ width: "100%" }} />
					<div className={classes.skeletonLine} style={{ width: "75%" }} />
					<div className={classes.skeletonLine} style={{ width: "50%" }} />
				</div>
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
