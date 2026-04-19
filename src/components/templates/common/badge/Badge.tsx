import { makeStyles, Badge as FluentBadge } from "@fluentui/react-components";
import { badgeStyles } from "./Badge.styles";
import type { IBadgeControl } from "../../templates.models";
import { toReactStyle, toTextStyle } from "../common.utils";

const useStyles = makeStyles(badgeStyles);

export interface IBadgeProps extends IBadgeControl {}

export const Badge = (props: IBadgeProps) => {
	const { value, color, label, style } = props;
	const classes = useStyles();

	return (
		<div style={toReactStyle(style)}>
			{label && (
				<span className={classes.label} style={toTextStyle(style)}>
					{label}
				</span>
			)}
			<FluentBadge appearance="filled" color={color ?? "informative"}>
				{value ?? ""}
			</FluentBadge>
		</div>
	);
};
