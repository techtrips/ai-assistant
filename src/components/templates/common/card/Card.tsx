import React, { useState } from "react";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { ChevronDown20Regular } from "@fluentui/react-icons";
import { cardStyles } from "./Card.styles";
import type { IControlStyle, FooterAlignment } from "../../templates.models";
import { toReactStyle, toTextStyle } from "../common.utils";

const useStyles = makeStyles(cardStyles);

export interface ICardProps {
	title: string;
	subtitle?: string;
	isCollapsible?: boolean;
	defaultExpanded?: boolean;
	style?: IControlStyle;
	height?: string | number;
	children?: React.ReactNode;
	headerActions?: React.ReactNode;
	footer?: React.ReactNode;
	footerAlignment?: FooterAlignment;
}

export const Card: React.FC<ICardProps> = ({
	title,
	subtitle,
	isCollapsible = false,
	defaultExpanded = true,
	style,
	children,
	headerActions,
	footer,
	footerAlignment,
	height,
}) => {
	const classes = useStyles();
	const [expanded, setExpanded] = useState(defaultExpanded);

	const rootStyle: React.CSSProperties = {
		...toReactStyle(style),
		...(height
			? { height: typeof height === "number" ? `${height}px` : height }
			: {}),
	};

	const footerClass = mergeClasses(
		classes.footer,
		footerAlignment === "start" && classes.footerStart,
		footerAlignment === "center" && classes.footerCenter,
		footerAlignment === "space-between" && classes.footerSpaceBetween,
	);

	return (
		<div className={classes.root} style={rootStyle}>
			<div
				className={mergeClasses(
					classes.header,
					!isCollapsible && classes.headerStatic,
				)}
				onClick={isCollapsible ? () => setExpanded((p) => !p) : undefined}
			>
				<div className={classes.headerLeft}>
					<span className={classes.title} style={toTextStyle(style)}>
						{title}
					</span>
					{subtitle && (
						<span className={classes.subtitle} style={toTextStyle(style)}>
							| {subtitle}
						</span>
					)}
				</div>
				{expanded && headerActions && (
					<div
						className={classes.headerActions}
						onClick={(e) => e.stopPropagation()}
					>
						{headerActions}
					</div>
				)}
				{isCollapsible && (
					<ChevronDown20Regular
						className={mergeClasses(
							classes.chevron,
							!expanded && classes.chevronCollapsed,
						)}
					/>
				)}
			</div>
			{expanded && (
				<>
					<div className={classes.body}>{children}</div>
					{footer && <div className={footerClass}>{footer}</div>}
				</>
			)}
		</div>
	);
};
