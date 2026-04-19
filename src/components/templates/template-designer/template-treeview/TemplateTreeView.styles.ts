import { makeStyles, tokens } from "@fluentui/react-components";

export const useTemplateTreeViewStyles = makeStyles({
	root: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
		minHeight: 0,
		overflow: "hidden",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		paddingLeft: tokens.spacingHorizontalM,
		paddingRight: tokens.spacingHorizontalM,
		paddingTop: tokens.spacingVerticalXS,
		paddingBottom: tokens.spacingVerticalXS,
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: tokens.colorNeutralStroke2,
		flexShrink: 0,
		height: "32px",
		boxSizing: "border-box" as const,
	},
	headerLabel: {
		textTransform: "uppercase" as const,
		letterSpacing: "0.5px",
	},
	treeContainer: {
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		overflowX: "hidden",
		paddingLeft: tokens.spacingHorizontalXS,
		paddingRight: tokens.spacingHorizontalXS,
		paddingBottom: tokens.spacingVerticalS,
	},
	selectedItem: {
		backgroundColor: tokens.colorBrandBackground2,
		borderRadius: tokens.borderRadiusMedium,
	},
	deleteButton: {
		opacity: 0.5,
		":hover": {
			opacity: 1,
			color: tokens.colorPaletteRedForeground1,
		},
	},
	dragging: {
		opacity: 0.4,
	},
	dropIndicatorBefore: {
		boxShadow: `inset 0 2px 0 0 ${tokens.colorBrandStroke1}`,
	},
	dropIndicatorAfter: {
		boxShadow: `inset 0 -2px 0 0 ${tokens.colorBrandStroke1}`,
	},
	dropIndicatorInside: {
		backgroundColor: tokens.colorBrandBackground2,
	},
});
