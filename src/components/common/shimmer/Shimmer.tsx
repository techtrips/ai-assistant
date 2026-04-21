import type { CSSProperties } from "react";
import { useShimmerStyles } from "./Shimmer.styles";

export interface IShimmerLineProps {
	width?: string;
	height?: string;
}

export interface IShimmerProps {
	/** Predefined layout: "list" | "card" | "lines" */
	layout?: "list" | "card" | "lines";
	/** Number of rows to render */
	rows?: number;
	/** Custom line widths per row (overrides layout) */
	lines?: IShimmerLineProps[];
}

const ShimmerLine = ({
	width = "100%",
	height = "14px",
}: IShimmerLineProps) => {
	const classes = useShimmerStyles();
	return (
		<div className={classes.line} style={{ width, height } as CSSProperties} />
	);
};

const ShimmerCircle = ({ size = 36 }: { size?: number }) => {
	const classes = useShimmerStyles();
	return (
		<div
			className={classes.circle}
			style={{ width: size, height: size } as CSSProperties}
		/>
	);
};

const ShimmerBlock = ({
	width = "100%",
	height = "60px",
}: {
	width?: string;
	height?: string;
}) => {
	const classes = useShimmerStyles();
	return (
		<div className={classes.block} style={{ width, height } as CSSProperties} />
	);
};

/** List layout: avatar circle + two lines */
const ListRow = () => {
	const classes = useShimmerStyles();
	return (
		<div className={classes.row}>
			<ShimmerCircle size={36} />
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					gap: "6px",
				}}
			>
				<ShimmerLine width="60%" height="12px" />
				<ShimmerLine width="40%" height="10px" />
			</div>
		</div>
	);
};

/** Card layout: block + lines */
const CardRow = () => (
	<>
		<ShimmerBlock width="100%" height="80px" />
		<ShimmerLine width="70%" height="14px" />
		<ShimmerLine width="50%" height="12px" />
	</>
);

/** Lines layout: varied-width lines */
const LinesRow = ({ index }: { index: number }) => {
	const widths = ["100%", "85%", "70%", "90%", "60%"];
	return <ShimmerLine width={widths[index % widths.length]} height="14px" />;
};

export const Shimmer = ({
	layout = "lines",
	rows = 4,
	lines,
}: IShimmerProps) => {
	const classes = useShimmerStyles();

	// Custom lines mode
	if (lines && lines.length > 0) {
		return (
			<div className={classes.container}>
				{lines.map((line, i) => (
					<ShimmerLine key={i} width={line.width} height={line.height} />
				))}
			</div>
		);
	}

	return (
		<div className={classes.container}>
			{Array.from({ length: rows }, (_, i) => {
				if (layout === "list") return <ListRow key={i} />;
				if (layout === "card") return <CardRow key={i} />;
				return <LinesRow key={i} index={i} />;
			})}
		</div>
	);
};

export { ShimmerLine, ShimmerCircle, ShimmerBlock };
