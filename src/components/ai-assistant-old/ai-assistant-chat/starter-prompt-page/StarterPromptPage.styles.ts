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

export const useStarterPromptPageStyles = makeStyles({
	toolbarTopRow: {
		display: "flex",
		alignItems: "center",
		width: "100%",
		...shorthands.gap("8px"),
	},
	toolbarTopRowSidebar: {
		flexDirection: "column",
		alignItems: "stretch",
		...shorthands.gap("8px"),
	},
	toolbarFooterRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
	},
	searchInput: {
		width: "100%",
		boxSizing: "border-box",
	},
	searchInputSidebar: {
		width: "100%",
		minWidth: 0,
	},
	searchInputField: {
		"::placeholder": {
			color: tokens.colorNeutralForeground4,
		},
	},
	addButton: {
		whiteSpace: "nowrap",
	},
	addButtonSidebar: {
		minWidth: "auto",
	},
	countText: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		alignSelf: "flex-start",
	},
	countTextSidebar: {
		fontSize: tokens.fontSizeBase100,
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
	list: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		overflowX: "hidden",
		...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
	},
	listSidebar: {
		...shorthands.padding("0", "6px", "0", "12px"),
		borderTopStyle: "none",
		...thinScrollbarStyles,
	},
	promptRow: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		...shorthands.gap("16px"),
		...shorthands.padding("18px", "8px"),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		backgroundColor: "transparent",
		outlineStyle: "none",
	},
	promptRowSidebar: {
		...shorthands.padding("10px", "2px", "10px", "4px"),
		...shorthands.borderRadius("0"),
	},
	promptContent: {
		flex: 1,
		minWidth: 0,
	},
	promptTitleRow: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		...shorthands.gap("10px"),
	},
	promptTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
	},
	promptTitleSidebar: {
		fontSize: tokens.fontSizeBase200,
	},
	agentBadge: {
		display: "inline-flex",
		alignItems: "center",
		...shorthands.padding("2px", "8px"),
		...shorthands.borderRadius(tokens.borderRadiusCircular),
		backgroundColor: tokens.colorBrandBackground2,
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorBrandForeground1,
	},
	agentBadgeSidebar: {
		...shorthands.padding("1px", "6px"),
		fontSize: tokens.fontSizeBase100,
	},
	promptText: {
		marginTop: "6px",
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	promptTextSidebar: {
		marginTop: "4px",
		fontSize: tokens.fontSizeBase100,
	},
	rowActions: {
		display: "flex",
		alignItems: "center",
		...shorthands.gap("4px"),
		flexShrink: 0,
	},
	rowActionsSidebar: {
		...shorthands.gap("8px"),
	},
	iconButton: {
		minWidth: "32px",
	},
	iconButtonSidebar: {
		minWidth: "20px",
		width: "20px",
		height: "20px",
		...shorthands.padding("0"),
	},
	rowActionTooltipTarget: {
		display: "inline-flex",
	},
	shimmerColumn: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("12px"),
	},
	shimmerRow: {
		display: "flex",
		...shorthands.gap("10px"),
		marginTop: "4px",
	},
	emptyState: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		textAlign: "center",
		flex: 1,
		minHeight: 0,
		...shorthands.padding("48px", "24px"),
	},
	emptyIcon: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: "56px",
		height: "56px",
		...shorthands.borderRadius(tokens.borderRadiusCircular),
		backgroundColor: tokens.colorNeutralBackground3,
		color: tokens.colorBrandForeground1,
	},
	emptyTitle: {
		marginTop: "16px",
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
	},
	emptyDescription: {
		maxWidth: "420px",
		marginTop: "8px",
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		lineHeight: tokens.lineHeightBase300,
	},
	emptyAction: {
		marginTop: "20px",
	},
	dialogContent: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("12px"),
	},
});
