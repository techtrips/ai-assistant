import { makeStyles, Image as FluentImage } from "@fluentui/react-components";
import { imageStyles } from "./Image.styles";
import type { IImageControl } from "../../templates.models";
import { toReactStyle } from "../common.utils";

const useStyles = makeStyles(imageStyles);

export interface IImageProps extends IImageControl {}

export const ImageControl = (props: IImageProps) => {
	const { src, alt, width, height, style } = props;
	const classes = useStyles();

	return (
		<FluentImage
			src={src ?? ""}
			alt={alt ?? ""}
			className={classes.root}
			style={toReactStyle(style)}
			width={width}
			height={height}
		/>
	);
};
