import { tokens, shorthands } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

const mobile = "@media (max-width: 479px)";
const tablet = "@media (max-width: 767px)";

export const cardStyles: Record<string, GriffelStyle> = {
	root: {
		backgroundColor: tokens.colorNeutralBackground1,
		...shorthands.borderRadius(tokens.borderRadiusXLarge),
		boxShadow: tokens.shadow8,
		...shorthands.overflow("hidden"),
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
		width: "100%",
		display: "flex",
		flexDirection: "column",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: "48px",
		...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
		userSelect: "none",
		cursor: "pointer",
		":hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
		[tablet]: {
			...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
		},
		[mobile]: {
			minHeight: "40px",
			...shorthands.padding(
				tokens.spacingVerticalXS,
				tokens.spacingHorizontalS,
			),
		},
	},
	headerStatic: {
		cursor: "default",
		":hover": { backgroundColor: "transparent" },
	},
	headerLeft: {
		display: "flex",
		alignItems: "center",
		...shorthands.gap(tokens.spacingHorizontalM),
		minWidth: 0,
		flex: 1,
	},
	headerActions: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		...shorthands.gap(tokens.spacingHorizontalXS),
		marginLeft: tokens.spacingHorizontalS,
		marginRight: tokens.spacingHorizontalS,
	},
	title: {
		fontSize: tokens.fontSizeBase600,
		fontWeight: tokens.fontWeightBold,
		color: tokens.colorNeutralForeground1,
	},
	subtitle: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
	},
	body: {
		display: "flex",
		flexDirection: "column",
		...shorthands.overflow("auto"),
		...shorthands.gap(tokens.spacingVerticalM),
		...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
		flex: 1,
		minHeight: 0,
		"> *": { flexShrink: 0 },
		[tablet]: {
			...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
		},
		[mobile]: {
			...shorthands.padding(
				tokens.spacingVerticalXS,
				tokens.spacingHorizontalS,
			),
		},
	},
	footer: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "flex-end",
		alignItems: "center",
		...shorthands.gap(tokens.spacingHorizontalS),
		...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
		...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
		[tablet]: {
			...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
		},
		[mobile]: {
			...shorthands.padding(
				tokens.spacingVerticalXS,
				tokens.spacingHorizontalS,
			),
		},
	},
	footerStart: { justifyContent: "flex-start" },
	footerCenter: { justifyContent: "center" },
	footerSpaceBetween: { justifyContent: "space-between" },
	chevron: {
		color: tokens.colorNeutralForeground3,
		flexShrink: 0,
		transitionProperty: "transform",
		transitionDuration: "200ms",
	},
	chevronCollapsed: { transform: "rotate(-90deg)" },
};
