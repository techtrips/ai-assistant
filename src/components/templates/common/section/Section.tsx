import React, { useState } from "react";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { ChevronDown20Regular } from "@fluentui/react-icons";
import { sectionStyles } from "./Section.styles";
import type { IControlStyle, FooterAlignment } from "../../templates.models";
import { toReactStyle, toTextStyle } from "../common.utils";

const useStyles = makeStyles(sectionStyles);

export interface ISectionProps {
	label: string;
	isCollapsible?: boolean;
	defaultExpanded?: boolean;
	nested?: boolean;
	style?: IControlStyle;
	height?: string | number;
	children?: React.ReactNode;
	headerActions?: React.ReactNode;
	footer?: React.ReactNode;
	footerAlignment?: FooterAlignment;
}

export const Section: React.FC<ISectionProps> = ({
	label,
	isCollapsible = false,
	defaultExpanded = true,
	nested,
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
		<div className={!nested ? classes.root : undefined} style={rootStyle}>
			<div
				className={mergeClasses(
					classes.header,
					!isCollapsible && classes.headerStatic,
				)}
				onClick={isCollapsible ? () => setExpanded((p) => !p) : undefined}
			>
				<span className={classes.title} style={toTextStyle(style)}>
					{label}
				</span>
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
			<div className={expanded ? classes.body : classes.bodyHidden}>
				{children}
			</div>
			{expanded && footer && <div className={footerClass}>{footer}</div>}
		</div>
	);
};
