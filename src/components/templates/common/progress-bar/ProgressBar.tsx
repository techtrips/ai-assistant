import {
	makeStyles,
	ProgressBar as FluentProgressBar,
} from "@fluentui/react-components";
import { progressBarStyles } from "./ProgressBar.styles";
import type { IProgressBarControl } from "../../templates.models";
import { toReactStyle, toTextStyle } from "../common.utils";

const useStyles = makeStyles(progressBarStyles);

export interface IProgressBarProps extends IProgressBarControl {}

export const ProgressBar = (props: IProgressBarProps) => {
	const { value, label, max, style } = props;
	const classes = useStyles();

	return (
		<div className={classes.root} style={toReactStyle(style)}>
			{label && (
				<span className={classes.label} style={toTextStyle(style)}>
					{label}
				</span>
			)}
			<FluentProgressBar value={(value ?? 0) / (max ?? 100)} />
		</div>
	);
};
