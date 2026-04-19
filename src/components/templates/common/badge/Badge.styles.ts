import { tokens } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

export const badgeStyles: Record<string, GriffelStyle> = {
	label: {
		fontSize: tokens.fontSizeBase100,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground3,
		textTransform: "uppercase",
		letterSpacing: "0.6px",
		marginBottom: "4px",
		display: "block",
	},
};
