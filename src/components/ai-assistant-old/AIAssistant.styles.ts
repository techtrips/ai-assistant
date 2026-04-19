import { makeStyles, tokens } from "@fluentui/react-components";

export const useAIAssistantStyles = makeStyles({
	root: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
		height: "100%",
		width: "100%",
		minHeight: 0,
		backgroundColor: tokens.colorNeutralBackground1,
	},
});
