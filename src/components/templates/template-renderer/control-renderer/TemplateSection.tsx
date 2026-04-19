import React from "react";
import type {
	ISectionControl,
	IControlProps,
	SectionLayout,
	ITemplateControl,
	IButtonControl,
} from "../../templates.models";
import {
	ControlType,
	getOrderedItems,
	type OrderedItem,
} from "../../templates.models";
import { resolveBindable } from "../bindingResolver";
import { ChildrenLayout, ControlRenderer } from "./ControlRenderer";
import { Section } from "../../common/section/Section";

interface IRenderOrderedOpts {
	layout?: SectionLayout;
	columns?: number;
	gap?: number;
	data?: Record<string, unknown>;
	onAction?: IControlProps["onAction"];
	nested?: boolean;
}

/**
 * Render an interleaved list of controls and sections.
 * Consecutive controls are batched into a single ChildrenLayout for correct grid behaviour.
 */
export const renderOrderedItems = (
	items: OrderedItem[],
	opts: IRenderOrderedOpts,
): React.ReactNode[] => {
	const result: React.ReactNode[] = [];
	let controlBatch: OrderedItem[] = [];

	const flushControls = () => {
		if (controlBatch.length === 0) return;
		result.push(
			<ChildrenLayout
				key={`batch-${controlBatch[0].item.id}`}
				controls={controlBatch.map((e) => e.item as ITemplateControl)}
				layout={opts.layout}
				columns={opts.columns}
				gap={opts.gap}
				data={opts.data}
				onAction={opts.onAction}
			/>,
		);
		controlBatch = [];
	};

	for (const entry of items) {
		if (entry.type === "control") {
			controlBatch.push(entry);
		} else {
			flushControls();
			result.push(
				<TemplateSection
					key={entry.item.id}
					{...entry.item}
					data={opts.data}
					onAction={opts.onAction}
					nested={opts.nested}
				/>,
			);
		}
	}
	flushControls();
	return result;
};

export interface ITemplateSectionProps extends ISectionControl, IControlProps {
	data?: Record<string, unknown>;
	nested?: boolean;
}

export const TemplateSection: React.FC<ITemplateSectionProps> = (props) => {
	const {
		label: labelProp,
		isCollapsible,
		defaultExpanded,
		layout,
		columns,
		gap,
		children,
		subsections,
		ordering,
		style,
		footerAlignment,
		data = {},
		onAction,
		nested,
	} = props;

	const label =
		typeof labelProp === "string"
			? labelProp
			: String(resolveBindable(labelProp, data) ?? "");

	const orderedItems = getOrderedItems(children, subsections, ordering);

	const isPlaced = (item: OrderedItem, p: string) =>
		item.type === "control" &&
		item.item.type === ControlType.Button &&
		(item.item as IButtonControl).placement === p;

	const headerButtons = orderedItems.filter((i) => isPlaced(i, "header"));
	const footerButtons = orderedItems.filter((i) => isPlaced(i, "footer"));
	const bodyItems = orderedItems.filter(
		(i) => !isPlaced(i, "header") && !isPlaced(i, "footer"),
	);

	const renderButtons = (buttons: OrderedItem[]) =>
		buttons.map((entry) => (
			<ControlRenderer
				key={entry.item.id}
				control={entry.item as ITemplateControl}
				data={data}
				onAction={onAction}
			/>
		));

	const sectionHeaderActions =
		headerButtons.length > 0 ? <>{renderButtons(headerButtons)}</> : undefined;

	const sectionFooter =
		footerButtons.length > 0 ? <>{renderButtons(footerButtons)}</> : undefined;

	return (
		<Section
			label={label}
			isCollapsible={isCollapsible}
			defaultExpanded={defaultExpanded}
			style={style}
			height={props.height}
			nested={nested}
			headerActions={sectionHeaderActions}
			footer={sectionFooter}
			footerAlignment={footerAlignment}
		>
			{renderOrderedItems(bodyItems, {
				layout,
				columns,
				gap,
				data,
				onAction,
				nested: true,
			})}
		</Section>
	);
};
