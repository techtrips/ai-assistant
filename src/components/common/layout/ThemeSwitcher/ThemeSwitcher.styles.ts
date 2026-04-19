import { makeStyles, tokens } from "@fluentui/react-components";

export const useStyles = makeStyles({
	container: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
	},
	label: {
		color: tokens.colorNeutralForeground1,
		fontSize: tokens.fontSizeBase300,
	},
	dropdown: {
		minWidth: "150px",
	},
});
