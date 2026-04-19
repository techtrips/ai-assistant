import { tokens, shorthands } from "@fluentui/react-components";

export const headerStyles = {
	header: {
		backgroundColor: tokens.colorNeutralBackgroundStatic,
		height: "85px",
	},
	brand: {
		height: "25px",
		...shorthands.margin("8px", "0px", "4px", "7px"),
	},
	navbar: {
		backgroundColor: tokens.colorNeutralCardBackgroundSelected,
		...shorthands.padding("1rem"),
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	navLinks: {
		listStyleType: "none",
		display: "flex",
		margin: "0px",
		paddingLeft: "0px",
	},
	link: {
		color: tokens.colorNeutralForeground1,
		textDecoration: "none",
		fontSize: tokens.fontSizeBase400,
		paddingRight: "20px",
	},
};
