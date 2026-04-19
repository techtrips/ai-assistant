import { tokens, shorthands } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

export const progressBarStyles: Record<string, GriffelStyle> = {
	root: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap(tokens.spacingVerticalXXS),
	},
	label: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
	},
};
