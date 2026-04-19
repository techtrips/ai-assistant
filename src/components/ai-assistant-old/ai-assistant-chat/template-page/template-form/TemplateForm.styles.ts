import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const thinScrollbarStyles = {
	scrollbarWidth: "thin" as const,
	scrollbarColor: `${tokens.colorNeutralForeground3} ${tokens.colorNeutralBackground3}`,
	"::-webkit-scrollbar": { width: "6px", height: "6px" },
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

export const useTemplateFormStyles = makeStyles({
	panelBusyOverlay: {
		position: "absolute",
		inset: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 10,
		backgroundColor: "rgba(255, 255, 255, 0.88)",
		backdropFilter: "blur(2px)",
	},
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
	formField: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("8px"),
	},
	formFieldHeader: {
		display: "flex",
		alignItems: "flex-start",
		...shorthands.gap("12px"),
	},
	formFieldContent: { paddingLeft: "36px", boxSizing: "border-box" },
	fieldIcon: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: "24px",
		height: "24px",
		color: tokens.colorBrandForeground1,
		flexShrink: 0,
	},
	fieldTitleGroup: { minWidth: 0, flex: 1 },
	fieldTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		lineHeight: tokens.lineHeightBase300,
	},
	fieldDescription: {
		marginTop: "4px",
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase300,
	},
	fieldInput: { width: "100%", maxWidth: "100%", minWidth: 0 },
	shimmerColumn: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("12px"),
	},
});
