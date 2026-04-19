import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useTemplateFormStyles = makeStyles({
	formField: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("6px"),
	},
	fieldTitle: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
	},
	fieldDescription: {
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorNeutralForeground2,
	},
	input: {
		width: "100%",
		boxSizing: "border-box",
		...shorthands.padding("6px", "10px"),
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
		backgroundColor: tokens.colorNeutralBackground1,
		outlineStyle: "none",
		fontFamily: "inherit",
		"::placeholder": { color: tokens.colorNeutralForeground4 },
	},
	textarea: {
		width: "100%",
		minHeight: "60px",
		boxSizing: "border-box",
		...shorthands.padding("6px", "10px"),
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
		backgroundColor: tokens.colorNeutralBackground1,
		outlineStyle: "none",
		fontFamily: "inherit",
		resize: "vertical" as const,
		"::placeholder": { color: tokens.colorNeutralForeground4 },
	},
	agentCheckboxes: {
		display: "flex",
		flexWrap: "wrap",
		...shorthands.gap("8px"),
	},
	agentCheckbox: {
		display: "inline-flex",
		alignItems: "center",
		...shorthands.gap("4px"),
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
		cursor: "pointer",
	},
});
