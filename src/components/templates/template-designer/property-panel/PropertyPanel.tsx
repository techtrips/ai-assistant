import { useCallback, useMemo } from "react";
import { Text } from "@fluentui/react-components";
import type {
	ITemplate,
	ICardControl,
	ISectionControl,
	ITemplateControl,
	IInputFieldControl,
	IButtonControl,
} from "../../templates.models";
import { ControlType } from "../../templates.models";
import type { IPropertyPanelProps } from "./PropertyPanel.models";
import {
	findSection,
	findControl,
	updateSectionInList,
	updateControlInSections,
} from "./PropertyPanel.models";
import { usePropertyPanelStyles } from "./PropertyPanel.styles";
import { StyleEditor } from "./style-editor/StyleEditor";
import { ControlEditor } from "./control-editors/ControlEditor";
import { CardEditor } from "./control-editors/CardEditor";
import { SectionEditor } from "./control-editors/SectionEditor";
import { GeneralEditor } from "./general-editor/GeneralEditor";
import { FormFieldEditor } from "./control-editors/FormFieldEditor";

export const PropertyPanel = (props: IPropertyPanelProps) => {
	const {
		template,
		selectedElement,
		onTemplateChange,
		bindingPaths = [],
		bindingData = {},
	} = props;
	const classes = usePropertyPanelStyles();

	// ---- Card helpers ----
	const updateCard = useCallback(
		(partial: Partial<ICardControl>) => {
			onTemplateChange({
				...template,
				card: { ...template.card, ...partial },
			});
		},
		[template, onTemplateChange],
	);

	// ---- Template root helpers ----
	const updateRoot = useCallback(
		(partial: Partial<ITemplate>) => {
			onTemplateChange({ ...template, ...partial });
		},
		[template, onTemplateChange],
	);

	// ---- Section helpers ----
	const updateSection = useCallback(
		(sectionId: string, partial: Partial<ISectionControl>) => {
			onTemplateChange({
				...template,
				card: {
					...template.card,
					sections: updateSectionInList(
						template.card.sections ?? [],
						sectionId,
						(s) => ({ ...s, ...partial }),
					),
				},
			});
		},
		[template, onTemplateChange],
	);

	// ---- Control helpers ----
	const updateControl = useCallback(
		(controlId: string, partial: Partial<ITemplateControl>) => {
			const updater = (c: ITemplateControl) =>
				({ ...c, ...partial }) as ITemplateControl;

			// Check if control is a direct card-level child
			const found = findControl(template, controlId);
			if (found && found.sectionId === "__card__") {
				onTemplateChange({
					...template,
					card: {
						...template.card,
						children: (template.card.children ?? []).map((c) => {
							if (c.id === controlId) return updater(c);
							return c;
						}),
					},
				});
			} else {
				onTemplateChange({
					...template,
					card: {
						...template.card,
						sections: updateControlInSections(
							template.card.sections ?? [],
							controlId,
							updater,
						),
					},
				});
			}
		},
		[template, onTemplateChange],
	);

	// ---- Collect InputField names + labels for binding ----
	const inputFieldInfo = useMemo(() => {
		const fields: { name: string; label: string }[] = [];
		const collect = (controls?: ITemplateControl[]) => {
			controls?.forEach((c) => {
				if (c.type === ControlType.InputField) {
					const f = c as IInputFieldControl;
					fields.push({ name: f.name, label: f.label });
				}
			});
		};
		collect(template.card.children);
		const walkSections = (sections?: ISectionControl[]) => {
			sections?.forEach((s) => {
				collect(s.children);
				walkSections(s.subsections);
			});
		};
		walkSections(template.card.sections);
		return fields;
	}, [template]);

	// ---- Rename field: update name in control + auto-update button prompts ----
	const renameField = useCallback(
		(controlId: string, oldName: string, newName: string) => {
			if (oldName === newName) return;
			const pattern = new RegExp(
				`\\{${oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}`,
				"g",
			);
			const replaceInPrompt = (c: ITemplateControl): ITemplateControl => {
				if (c.type === ControlType.Button) {
					const btn = c as IButtonControl;
					if (btn.prompt && pattern.test(btn.prompt)) {
						return {
							...btn,
							prompt: btn.prompt.replace(pattern, `{${newName}}`),
						} as ITemplateControl;
					}
				}
				return c;
			};
			const updateSections = (secs: ISectionControl[]): ISectionControl[] =>
				secs.map((s) => ({
					...s,
					children: s.children?.map(replaceInPrompt),
					subsections: s.subsections
						? updateSections(s.subsections)
						: undefined,
				}));
			const updatedChildren = template.card.children?.map((c) =>
				c.id === controlId
					? ({ ...c, name: newName } as ITemplateControl)
					: replaceInPrompt(c),
			);
			const updatedSections = updateSections(template.card.sections ?? []).map(
				(s) => ({
					...s,
					children: s.children?.map((c) =>
						c.id === controlId
							? ({ ...c, name: newName } as ITemplateControl)
							: c,
					),
				}),
			);
			onTemplateChange({
				...template,
				card: {
					...template.card,
					children: updatedChildren,
					sections: updatedSections,
				},
			});
		},
		[template, onTemplateChange],
	);

	// ---- Resolve selected ----
	const selectedData = useMemo(() => {
		if (!selectedElement) return undefined;
		if (selectedElement.type === "card")
			return { type: "card" as const, card: template.card };
		if (selectedElement.type === "section") {
			const section = findSection(template.card.sections, selectedElement.id);
			return section ? { type: "section" as const, section } : undefined;
		}
		if (selectedElement.type === "control") {
			const found = findControl(template, selectedElement.id);
			return found ? { type: "control" as const, ...found } : undefined;
		}
		return undefined;
	}, [selectedElement, template]);

	// ---- Main render ----
	if (!selectedData) {
		return (
			<div className={classes.empty}>
				<Text size={200}>
					Select an element from the tree to edit its properties
				</Text>
			</div>
		);
	}

	if (selectedData.type === "card") {
		return (
			<CardEditor
				template={template}
				onUpdateCard={updateCard}
				onUpdateRoot={updateRoot}
				classes={classes}
				bindingPaths={bindingPaths}
				className={classes.root}
			/>
		);
	}

	if (selectedData.type === "section") {
		return (
			<SectionEditor
				section={selectedData.section}
				onUpdateSection={updateSection}
				classes={classes}
				bindingPaths={bindingPaths}
				className={classes.root}
			/>
		);
	}

	const { control } = selectedData;

	// InputField controls get the FormFieldEditor
	if (control.type === ControlType.InputField) {
		return (
			<div className={classes.root}>
				<FormFieldEditor
					field={control as IInputFieldControl}
					onUpdate={updateControl}
					onRenameField={renameField}
					existingNames={inputFieldInfo.map((f) => f.name)}
					classes={classes}
					bindingPaths={bindingPaths}
				/>
				<StyleEditor
					style={control.style}
					onChange={(s) => updateControl(control.id, { style: s })}
					classes={classes}
				/>
			</div>
		);
	}

	return (
		<div className={classes.root}>
			<GeneralEditor
				control={control}
				onUpdate={updateControl}
				classes={classes}
			/>

			<ControlEditor
				control={control}
				onUpdate={updateControl}
				classes={classes}
				bindingPaths={bindingPaths}
				bindingData={bindingData}
				inputFieldInfo={inputFieldInfo}
			/>

			<StyleEditor
				style={control.style}
				onChange={(s) => updateControl(control.id, { style: s })}
				classes={classes}
			/>
		</div>
	);
};
