import { shorthands } from "@fluentui/react-components";
import type { GriffelStyle } from "@fluentui/react-components";

export const layoutStyles: Record<string, GriffelStyle> = {
	stack: {
		display: "flex",
		flexDirection: "column",
		...shorthands.gap("12px"),
	},
	row: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "flex-start",
		...shorthands.gap("12px"),
	},
	grid2: {
		display: "grid",
		gridTemplateColumns: "repeat(2, 1fr)",
		...shorthands.gap("12px"),
	},
	grid3: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		...shorthands.gap("12px"),
	},
	grid4: {
		display: "grid",
		gridTemplateColumns: "repeat(4, 1fr)",
		...shorthands.gap("12px"),
	},
	gap4: { ...shorthands.gap("4px") },
	gap8: { ...shorthands.gap("8px") },
	gap16: { ...shorthands.gap("16px") },
	gap24: { ...shorthands.gap("24px") },
};
