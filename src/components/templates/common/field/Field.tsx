import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { fieldStyles } from "./Field.styles";
import type { IFieldControl, ControlValue } from "../../templates.models";
import { formatValue, toReactStyle, toTextStyle } from "../common.utils";

const useStyles = makeStyles(fieldStyles);

export interface IFieldProps extends IFieldControl {}

export const Field = (props: IFieldProps) => {
	const { value, label, format, style } = props;
	const classes = useStyles();
	const textStyle = toTextStyle(style);
	const isEmpty = value == null;

	return (
		<div className={classes.root} style={toReactStyle(style)}>
			<span className={classes.label} style={textStyle}>
				{label}
			</span>
			<span
				className={mergeClasses(classes.value, isEmpty && classes.emptyValue)}
				style={textStyle}
			>
				{formatValue(value as ControlValue, format)}
			</span>
		</div>
	);
};
