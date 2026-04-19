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

export const useConversationHistoryPageStyles = makeStyles({
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
	newChatButton: {
		whiteSpace: "nowrap",
	},
	newChatButtonSidebar: {
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
	card: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		...shorthands.gap("16px"),
		...shorthands.border("none"),
		...shorthands.padding("18px", "8px"),
		...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		width: "100%",
		backgroundColor: "transparent",
		textAlign: "left" as const,
		cursor: "pointer",
		outlineStyle: "none",
		fontFamily: "inherit",
		fontSize: "inherit",
		lineHeight: "inherit",
		appearance: "none" as const,
		WebkitAppearance: "none" as const,
		":hover": {
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
		":focus-visible": {
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
	},
	cardSidebar: {
		...shorthands.padding("10px", "2px", "10px", "4px"),
		...shorthands.borderRadius("0"),
		":last-child": {
			borderBottomStyle: "none",
		},
	},
	cardContent: {
		flex: 1,
		minWidth: 0,
	},
	cardTitleRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		...shorthands.gap("10px"),
		width: "100%",
		minWidth: 0,
	},
	cardTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		flex: 1,
	},
	cardTitleSidebar: {
		fontSize: tokens.fontSizeBase200,
	},
	cardTime: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		whiteSpace: "nowrap",
		flexShrink: 0,
	},
	cardTimeSidebar: {
		fontSize: tokens.fontSizeBase100,
	},
	cardDescription: {
		marginTop: "6px",
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	cardDescriptionSidebar: {
		marginTop: "4px",
		fontSize: tokens.fontSizeBase100,
	},
});
