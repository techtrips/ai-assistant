import React, { useMemo } from "react";
import type {
	ICardControl,
	IControlProps,
	ISectionControl,
	IInputFieldControl,
	ITemplateControl,
	IButtonControl,
} from "../../templates.models";
import { ControlType, getOrderedItems } from "../../templates.models";
import { resolveBindable, resolveBinding } from "../bindingResolver";
import { renderOrderedItems } from "./TemplateSection";
import { ControlRenderer } from "./ControlRenderer";
import { Card } from "../../common/card/Card";
import { FormProvider } from "../../common/form/FormContext";

export interface ITemplateCardProps extends ICardControl, IControlProps {
	data?: Record<string, unknown>;
}

export const TemplateCard: React.FC<ITemplateCardProps> = (props) => {
	const {
		title: titleProp,
		subtitle: subtitleProp,
		isCollapsible,
		defaultExpanded,
		layout,
		columns,
		gap,
		children,
		sections,
		ordering,
		style,
		footerAlignment,
		data = {},
		onAction,
	} = props;

	const title =
		typeof titleProp === "string"
			? titleProp
			: String(resolveBindable(titleProp, data) ?? "");

	const subtitle = subtitleProp
		? typeof subtitleProp === "string"
			? subtitleProp
			: String(resolveBindable(subtitleProp, data) ?? "")
		: undefined;

	// Collect all InputField controls across card children + all sections
	const allInputFields = useMemo(() => {
		const fields: IInputFieldControl[] = [];
		const collect = (controls?: ITemplateControl[]) =>
			controls?.forEach((c) => {
				if (c.type === ControlType.InputField) {
					const field = c as IInputFieldControl;
					// Resolve binding into defaultValue if needed
					if (field.defaultValue?.binding) {
						const resolved = resolveBinding(field.defaultValue.binding, data);
						fields.push({
							...field,
							defaultValue: {
								...field.defaultValue,
								value:
									resolved === null ||
									resolved === undefined ||
									typeof resolved === "string" ||
									typeof resolved === "number" ||
									typeof resolved === "boolean"
										? (resolved as IInputFieldControl["defaultValue"] extends {
												value?: infer V;
											}
												? V
												: never)
										: String(resolved ?? ""),
							},
						} as IInputFieldControl);
					} else {
						fields.push(field);
					}
				}
			});
		const walkSections = (secs?: ISectionControl[]) =>
			secs?.forEach((s) => {
				collect(s.children);
				walkSections(s.subsections);
			});
		collect(children);
		walkSections(sections);
		return fields;
	}, [children, sections, data]);

	const hasInputFields = allInputFields.length > 0;

	const orderedItems = getOrderedItems(children, sections, ordering);

	// Split buttons by placement: header, footer, or inline (default).
	const isPlaced = (item: (typeof orderedItems)[number], p: string) =>
		item.type === "control" &&
		item.item.type === ControlType.Button &&
		(item.item as IButtonControl).placement === p;

	const headerButtons = orderedItems.filter((i) => isPlaced(i, "header"));
	const footerButtons = orderedItems.filter((i) => isPlaced(i, "footer"));
	const bodyItems = orderedItems.filter(
		(i) => !isPlaced(i, "header") && !isPlaced(i, "footer"),
	);

	const cardBody = (
		<>
			{renderOrderedItems(bodyItems, { layout, columns, gap, data, onAction })}
		</>
	);

	const renderButtons = (buttons: typeof orderedItems) =>
		buttons.map((entry) => (
			<ControlRenderer
				key={entry.item.id}
				control={entry.item as ITemplateControl}
				data={data}
				onAction={onAction}
			/>
		));

	const cardHeaderActions =
		headerButtons.length > 0 ? <>{renderButtons(headerButtons)}</> : undefined;

	const cardFooter =
		footerButtons.length > 0 ? <>{renderButtons(footerButtons)}</> : undefined;

	return (
		<Card
			title={title}
			subtitle={subtitle}
			isCollapsible={isCollapsible}
			defaultExpanded={defaultExpanded}
			style={style}
			height={props.height}
			headerActions={cardHeaderActions}
			footer={cardFooter}
			footerAlignment={footerAlignment}
		>
			{hasInputFields ? (
				<FormProvider controls={allInputFields}>{cardBody}</FormProvider>
			) : (
				cardBody
			)}
		</Card>
	);
};
