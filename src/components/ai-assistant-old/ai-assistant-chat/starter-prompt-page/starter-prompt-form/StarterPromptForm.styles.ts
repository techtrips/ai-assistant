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

export const useStarterPromptFormStyles = makeStyles({
	panelShimmerOverlay: {
		position: "absolute",
		inset: 0,
		display: "flex",
		flexDirection: "column",
		zIndex: 10,
		backgroundColor: tokens.colorNeutralBackground1,
		...shorthands.padding("20px", "18px", "24px"),
		...shorthands.gap("24px"),
		overflowY: "auto",
		...thinScrollbarStyles,
	},
	shimmerField: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("12px"),
	},
	formField: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("8px"),
	},
	formFieldSidebar: {
		...shorthands.gap("6px"),
	},
	formFieldHeader: {
		display: "flex",
		alignItems: "flex-start",
		...shorthands.gap("12px"),
	},
	formFieldHeaderSidebar: {
		...shorthands.gap("8px"),
	},
	formFieldContent: {
		paddingLeft: "36px",
		boxSizing: "border-box",
	},
	formFieldContentSidebar: {
		paddingLeft: "28px",
	},
	fieldIcon: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: "24px",
		height: "24px",
		color: tokens.colorBrandForeground1,
		flexShrink: 0,
	},
	fieldIconSidebar: {
		width: "20px",
		height: "20px",
		fontSize: "16px",
	},
	fieldTitleGroup: {
		minWidth: 0,
		flex: 1,
	},
	fieldTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		lineHeight: tokens.lineHeightBase300,
	},
	fieldTitleSidebar: {
		fontSize: tokens.fontSizeBase200,
		lineHeight: tokens.lineHeightBase200,
	},
	fieldDescription: {
		marginTop: "4px",
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase300,
	},
	fieldInput: {
		width: "100%",
		maxWidth: "100%",
		minWidth: 0,
	},
	promptInput: {
		width: "100%",
		minHeight: "108px",
	},
	promptEditor: {
		position: "relative",
		width: "100%",
	},
	promptParameterSuggestions: {
		position: "absolute",
		width: "220px",
		maxWidth: "calc(100% - 12px)",
		display: "flex",
		flexDirection: "column",
		backgroundColor: tokens.colorNeutralBackground1,
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
		boxShadow: tokens.shadow8,
		maxHeight: "180px",
		overflowY: "auto",
		zIndex: 30,
	},
	promptParameterSuggestionItem: {
		width: "100%",
		textAlign: "left",
		...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
		border: "none",
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: tokens.colorNeutralStroke2,
		backgroundColor: "transparent",
		color: tokens.colorNeutralForeground1,
		fontFamily: "inherit",
		fontSize: tokens.fontSizeBase200,
		cursor: "pointer",
		":hover": {
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
		":last-child": {
			borderBottomWidth: 0,
		},
	},
	promptParameterSuggestionItemActive: {
		backgroundColor: tokens.colorNeutralBackground1Hover,
	},
	tagsInput: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		...shorthands.gap("8px"),
		minHeight: "40px",
		...shorthands.padding("8px", "10px"),
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		backgroundColor: tokens.colorNeutralBackground1,
	},
	tagChip: {
		display: "inline-flex",
		alignItems: "center",
		...shorthands.gap("4px"),
		...shorthands.padding("4px", "10px"),
		...shorthands.borderRadius(tokens.borderRadiusCircular),
		backgroundColor: tokens.colorNeutralBackground3,
		color: tokens.colorNeutralForeground2,
		fontSize: tokens.fontSizeBase200,
	},
	tagRemove: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: "16px",
		height: "16px",
		...shorthands.padding("0"),
		...shorthands.border("none"),
		backgroundColor: "transparent",
		color: tokens.colorNeutralForeground3,
		cursor: "pointer",
		":hover": {
			color: tokens.colorNeutralForeground1,
		},
	},
	tagInlineInput: {
		flex: 1,
		minWidth: "160px",
		...shorthands.padding("2px", "0"),
		...shorthands.border("none"),
		backgroundColor: "transparent",
		color: tokens.colorNeutralForeground1,
		fontSize: tokens.fontSizeBase300,
		outlineStyle: "none",
		fontFamily: "inherit",
		"::placeholder": {
			color: tokens.colorNeutralForeground4,
		},
	},
});
