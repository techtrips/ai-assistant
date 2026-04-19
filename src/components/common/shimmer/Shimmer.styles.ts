import { makeStyles, shorthands } from "@fluentui/react-components";

const shimmer = {
	"0%": { backgroundPosition: "200% 0" },
	"100%": { backgroundPosition: "-200% 0" },
};

const shimmerBase = {
	backgroundColor: "rgba(0, 0, 0, 0.04)",
	backgroundImage:
		"linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.04) 80%)",
	backgroundSize: "200% 100%",
	animationName: shimmer,
	animationDuration: "2s",
	animationTimingFunction: "ease-in-out",
	animationIterationCount: "infinite",
} as const;

export const useShimmerStyles = makeStyles({
	container: {
		display: "flex",
		flexDirection: "column",
		width: "100%",
		...shorthands.gap("12px"),
		...shorthands.padding("16px"),
		boxSizing: "border-box",
	},
	row: {
		display: "flex",
		alignItems: "center",
		...shorthands.gap("12px"),
	},
	line: {
		height: "14px",
		...shorthands.borderRadius("4px"),
		...shimmerBase,
	},
	circle: {
		flexShrink: 0,
		...shorthands.borderRadius("50%"),
		...shimmerBase,
	},
	block: {
		...shorthands.borderRadius("8px"),
		...shimmerBase,
	},
});
