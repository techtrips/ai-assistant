import { makeStyles, shorthands } from "@fluentui/react-components";

const typingBounce = {
	"0%, 80%, 100%": {
		transform: "scale(0.6)",
		opacity: "0.5",
	},
	"40%": {
		transform: "scale(1)",
		opacity: "1",
	},
};

export const useChatAreaStyles = makeStyles({
	thread: {
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		overflowX: "hidden",
		width: "100%",
		maxWidth: "920px",
		alignSelf: "center",
		...shorthands.padding("12px", "8px", "8px"),
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("10px"),
	},
	typingIndicator: {
		display: "inline-flex",
		alignItems: "center",
		...shorthands.gap("6px"),
	},
	typingDot: {
		width: "6px",
		height: "6px",
		borderRadius: "50%",
		backgroundColor: "var(--agent-chat-brand)",
		animationName: typingBounce,
		animationDuration: "1.4s",
		animationTimingFunction: "ease-in-out",
		animationIterationCount: "infinite",
		animationFillMode: "both",
	},
	typingDot1: {
		animationDelay: "0s",
	},
	typingDot2: {
		animationDelay: "0.16s",
	},
	typingDot3: {
		animationDelay: "0.32s",
	},
});
