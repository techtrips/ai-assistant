import { tokens, shorthands } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

const mobile = "@media (max-width: 479px)";

export const sectionStyles: Record<string, GriffelStyle> = {
	root: {
		backgroundColor: tokens.colorNeutralBackground1,
		...shorthands.borderRadius(tokens.borderRadiusLarge),
		...shorthands.overflow("hidden"),
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke3),
		display: "flex",
		flexDirection: "column",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: "40px",
		...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke3),
		cursor: "pointer",
		userSelect: "none",
		":hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
		[mobile]: {
			minHeight: "36px",
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
	title: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
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
	body: {
		...shorthands.overflow("auto"),
		flex: 1,
		minHeight: 0,
		...shorthands.padding(
			tokens.spacingVerticalS,
			tokens.spacingHorizontalM,
			tokens.spacingVerticalS,
		),
		[mobile]: {
			...shorthands.padding(
				tokens.spacingVerticalXS,
				tokens.spacingHorizontalS,
				tokens.spacingVerticalXS,
			),
		},
	},
	bodyHidden: { display: "none" },
	footer: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "flex-end",
		alignItems: "center",
		...shorthands.gap(tokens.spacingHorizontalXS),
		...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
		...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke3),
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
