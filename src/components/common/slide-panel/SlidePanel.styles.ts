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

export const useSlidePanelStyles = makeStyles({
	layer: {
		position: "absolute",
		inset: 0,
		display: "flex",
		justifyContent: "flex-end",
		zIndex: 40,
	},
	backdrop: {
		position: "absolute",
		inset: 0,
		backgroundColor: "rgba(15, 23, 42, 0.18)",
		backdropFilter: "blur(2px)",
	},
	panel: {
		position: "relative",
		display: "flex",
		flexDirection: "column",
		width: "min(500px, 100%)",
		height: "100%",
		backgroundColor: tokens.colorNeutralBackground1,
		boxShadow: tokens.shadow16,
		...shorthands.borderLeft("1px", "solid", tokens.colorNeutralStroke2),
	},
	panelSidebar: {
		width: "90%",
		boxShadow: "none",
		...shorthands.borderLeft("none"),
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		...shorthands.gap("12px"),
		...shorthands.padding("8px", "16px"),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
		flexShrink: 0,
	},
	headerSidebar: {
		...shorthands.padding("6px", "12px"),
		...shorthands.gap("8px"),
	},
	titleGroup: {
		minWidth: 0,
		flex: 1,
	},
	titleRow: {
		display: "flex",
		alignItems: "center",
		...shorthands.gap("8px"),
	},
	titleIcon: {
		color: tokens.colorBrandForeground1,
		fontSize: "20px",
		flexShrink: 0,
	},
	titleIconSidebar: {
		fontSize: "16px",
	},
	title: {
		fontSize: tokens.fontSizeBase500,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
	},
	titleSidebar: {
		fontSize: tokens.fontSizeBase300,
	},
	closeButton: {
		minWidth: "32px",
		width: "32px",
		height: "32px",
		...shorthands.padding("0"),
		...shorthands.border("none"),
		...shorthands.borderRadius("50%"),
		backgroundColor: "transparent",
	},
	body: {
		position: "relative",
		display: "flex",
		flexDirection: "column",
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		...shorthands.padding("20px", "18px", "24px"),
		...shorthands.gap("18px"),
		...thinScrollbarStyles,
	},
	bodySidebar: {
		...shorthands.padding("12px", "12px", "16px"),
		...shorthands.gap("14px"),
	},
	footer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		...shorthands.gap("10px"),
		...shorthands.padding("16px"),
		...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
		backgroundColor: tokens.colorNeutralBackground1,
	},
	footerSidebar: {
		...shorthands.padding("8px", "12px"),
		...shorthands.gap("8px"),
	},
	primaryButton: {
		minWidth: "96px",
	},
	primaryButtonSidebar: {
		minWidth: "72px",
	},
	secondaryButton: {
		minWidth: "96px",
	},
	secondaryButtonSidebar: {
		minWidth: "72px",
	},
	errorBanner: {
		marginBottom: "12px",
		...shorthands.padding("10px", "12px"),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		backgroundColor: tokens.colorPaletteRedBackground1,
		color: tokens.colorPaletteRedForeground1,
		fontSize: tokens.fontSizeBase200,
		lineHeight: tokens.lineHeightBase200,
	},
});
