import { useState } from "react";
import { Text, Label, mergeClasses } from "@fluentui/react-components";
import { ChevronDown20Regular } from "@fluentui/react-icons";
import type { CollapsibleClasses } from "./PropertyPanel.models";

export const FieldGroup = ({
	label,
	children,
	className,
}: {
	label: string;
	children: React.ReactNode;
	className: string;
}) => (
	<div className={className}>
		<Label weight="semibold" size="small">
			{label}
		</Label>
		{children}
	</div>
);

export const CollapsibleSection = ({
	title,
	children,
	classes,
	defaultExpanded = true,
}: {
	title: string;
	children: React.ReactNode;
	classes: CollapsibleClasses;
	defaultExpanded?: boolean;
}) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	return (
		<div className={classes.sectionGroup}>
			<div
				className={classes.sectionHeader}
				onClick={() => setExpanded((v) => !v)}
			>
				<Text weight="semibold" size={200} className={classes.sectionTitle}>
					{title}
				</Text>
				<ChevronDown20Regular
					className={mergeClasses(
						classes.sectionChevron,
						!expanded && classes.sectionChevronCollapsed,
					)}
				/>
			</div>
			<div
				className={mergeClasses(
					classes.sectionBody,
					!expanded && classes.sectionBodyHidden,
				)}
			>
				{children}
			</div>
		</div>
	);
};
