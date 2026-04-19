import { tokens, shorthands } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

export const formStyles: Record<string, GriffelStyle> = {
	root: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("16px"),
	},
	fieldWrapper: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap(tokens.spacingVerticalXXS),
		minWidth: 0,
	},
	label: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
	},
	required: {
		color: tokens.colorPaletteRedForeground1,
		marginLeft: "2px",
	},
	error: {
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorPaletteRedForeground1,
		marginTop: "2px",
	},
	actions: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-end",
		...shorthands.gap("8px"),
		marginTop: "4px",
	},
	// Layout variants for the fields container
	stack: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("12px"),
	},
	row: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "flex-start",
		...shorthands.gap("12px"),
	},
	grid2: {
		display: "grid",
		gridTemplateColumns: "repeat(2, 1fr)",
		...shorthands.gap("12px"),
	},
	grid3: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		...shorthands.gap("12px"),
	},
	grid4: {
		display: "grid",
		gridTemplateColumns: "repeat(4, 1fr)",
		...shorthands.gap("12px"),
	},
};
