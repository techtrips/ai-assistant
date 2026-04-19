import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const thinScrollbarStyles = {
	scrollbarWidth: "thin" as const,
	scrollbarColor: `${tokens.colorNeutralForeground3} ${tokens.colorNeutralBackground3}`,
	"::-webkit-scrollbar": {
		width: "6px",
		height: "6px",
	},
	"::-webkit-scrollbar-track": {
		backgroundColor: tokens.colorNeutralBackground3,
		...shorthands.borderRadius(tokens.borderRadiusCircular),
	},
	"::-webkit-scrollbar-thumb": {
		backgroundColor: tokens.colorNeutralForeground3,
		...shorthands.borderRadius(tokens.borderRadiusCircular),
	},
	"::-webkit-scrollbar-thumb:hover": {
		backgroundColor: tokens.colorNeutralForeground3,
	},
};

export const useSettingsPageStyles = makeStyles({
	description: {
		margin: 0,
		maxWidth: "680px",
		fontSize: tokens.fontSizeBase300,
		lineHeight: tokens.lineHeightBase300,
		color: tokens.colorNeutralForeground3,
	},
	descriptionSidebar: {
		maxWidth: "none",
		...shorthands.padding("10px", "12px", "12px"),
		fontSize: tokens.fontSizeBase200,
		lineHeight: tokens.lineHeightBase200,
	},
	body: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		overflowX: "hidden",
		...shorthands.gap("12px"),
		...shorthands.padding("12px", "0"),
	},
	bodySidebar: {
		...shorthands.padding("0", "6px", "0", "12px"),
		...shorthands.gap("0"),
		...thinScrollbarStyles,
	},
	section: {
		display: "flex",
		flexDirection: "column" as const,
		backgroundColor: tokens.colorNeutralBackground1,
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
		...shorthands.borderRadius("16px"),
		...shorthands.padding("18px", "20px"),
		...shorthands.gap("16px"),
		boxShadow: tokens.shadow4,
	},
	sectionSidebar: {
		...shorthands.margin("12px"),
		...shorthands.borderRadius("12px"),
		...shorthands.padding("14px"),
		...shorthands.gap("12px"),
		boxShadow: "none",
	},
	settingRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		...shorthands.gap("16px"),
		"@media (max-width: 640px)": {
			flexDirection: "column",
			alignItems: "stretch",
		},
	},
	settingRowSidebar: {
		...shorthands.gap("12px"),
	},
	settingCopy: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("4px"),
		minWidth: 0,
	},
	settingLabel: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
	},
	settingLabelSidebar: {
		fontSize: tokens.fontSizeBase200,
	},
	settingDescription: {
		fontSize: tokens.fontSizeBase200,
		lineHeight: tokens.lineHeightBase200,
		color: tokens.colorNeutralForeground3,
	},
	settingDescriptionSidebar: {
		fontSize: tokens.fontSizeBase100,
	},
	settingDivider: {
		height: "1px",
		backgroundColor: tokens.colorNeutralStroke2,
		...shorthands.border("0"),
		...shorthands.margin("0"),
	},
});
