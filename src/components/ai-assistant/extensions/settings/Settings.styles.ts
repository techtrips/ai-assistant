import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const thinScrollbar = {
	scrollbarWidth: "thin" as const,
	scrollbarColor: `${tokens.colorNeutralForeground3} ${tokens.colorNeutralBackground3}`,
};

export const useSettingsStyles = makeStyles({
	body: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("20px"),
		...shorthands.padding("12px"),
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		overflowX: "hidden",
		...thinScrollbar,
	},
	section: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("6px"),
	},
	sectionTitle: {
		fontSize: tokens.fontSizeBase100,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground3,
		textTransform: "uppercase" as const,
		letterSpacing: "0.5px",
		...shorthands.padding("0", "2px"),
	},
	card: {
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		backgroundColor: tokens.colorNeutralBackground1,
		overflow: "hidden",
	},
	settingRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		cursor: "pointer",
		...shorthands.gap("12px"),
		...shorthands.padding("10px", "14px"),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke3),
		":last-child": { borderBottomStyle: "none" },
	},
	settingLabel: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
	},
	saving: {
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorNeutralForeground3,
		fontStyle: "italic",
		fontWeight: tokens.fontWeightRegular,
	},
	dropdownRow: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("8px"),
		...shorthands.padding("10px", "14px"),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke3),
		":last-child": { borderBottomStyle: "none" },
	},
	agentChips: {
		display: "flex",
		flexWrap: "wrap",
		...shorthands.gap("6px"),
	},
	agentChip: {
		display: "inline-flex",
		alignItems: "center",
		...shorthands.gap("4px"),
		...shorthands.padding("2px", "8px"),
		fontSize: tokens.fontSizeBase100,
		backgroundColor: tokens.colorBrandBackground2,
		color: tokens.colorBrandForeground2,
		...shorthands.borderRadius(tokens.borderRadiusCircular),
		...shorthands.border("none"),
	},
	agentChipRemove: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		...shorthands.border("none"),
		backgroundColor: "transparent",
		cursor: "pointer",
		color: tokens.colorBrandForeground2,
		...shorthands.padding("0"),
		fontSize: "10px",
		":hover": {
			color: tokens.colorPaletteRedForeground1,
		},
	},
});
