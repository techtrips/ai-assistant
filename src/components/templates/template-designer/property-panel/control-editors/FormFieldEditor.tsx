import {
	Input,
	Dropdown,
	Option,
	Checkbox,
	Button,
	Text,
	tokens,
} from "@fluentui/react-components";
import { AddRegular, DeleteRegular } from "@fluentui/react-icons";
import type {
	IInputFieldControl,
	IFormOption,
	ITemplateControl,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import type { EditorClasses } from "../PropertyPanel.models";
import { FORM_INPUT_TYPES } from "../PropertyPanel.models";

export const FormFieldEditor = ({
	field,
	onUpdate,
	onRenameField,
	existingNames = [],
	classes,
	bindingPaths,
}: {
	field: IInputFieldControl;
	onUpdate: (controlId: string, partial: Partial<ITemplateControl>) => void;
	onRenameField?: (controlId: string, oldName: string, newName: string) => void;
	existingNames?: string[];
	classes: EditorClasses;
	bindingPaths: string[];
}) => {
	const update = (partial: Partial<IInputFieldControl>) =>
		onUpdate(field.id, partial as Partial<ITemplateControl>);

	const hasOptions =
		field.inputType === "dropdown" || field.inputType === "radio";

	// Check for duplicate name (exclude current field's own name)
	const isDuplicateName = existingNames.some(
		(n) =>
			n === field.name &&
			existingNames.indexOf(n) !== existingNames.lastIndexOf(n),
	);

	return (
		<>
			<CollapsibleSection title="Field Properties" classes={classes}>
				<FieldGroup label="Name" className={classes.field}>
					<Input
						size="small"
						value={field.name}
						onChange={(_, d) => {
							const newName = d.value;
							const conflict = existingNames.some(
								(n) => n === newName && n !== field.name,
							);
							if (conflict) {
								// Still update locally so user sees what they typed,
								// but skip the prompt auto-rename
								update({ name: newName });
							} else if (onRenameField) {
								onRenameField(field.id, field.name, newName);
							} else {
								update({ name: newName });
							}
						}}
					/>
					{isDuplicateName && (
						<span
							style={{
								color: tokens.colorPaletteRedForeground1,
								fontSize: tokens.fontSizeBase100,
							}}
						>
							Name "{field.name}" is already used by another field
						</span>
					)}
				</FieldGroup>
				<FieldGroup label="Label" className={classes.field}>
					<Input
						size="small"
						value={field.label}
						onChange={(_, d) => update({ label: d.value })}
					/>
				</FieldGroup>
				<FieldGroup label="Input Type" className={classes.field}>
					<Dropdown
						size="small"
						value={field.inputType}
						selectedOptions={[field.inputType]}
						onOptionSelect={(_, d) =>
							update({
								inputType: d.optionValue as IInputFieldControl["inputType"],
							})
						}
					>
						{FORM_INPUT_TYPES.map((t) => (
							<Option key={t} value={t}>
								{t}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
				<FieldGroup label="Placeholder" className={classes.field}>
					<Input
						size="small"
						value={field.placeholder ?? ""}
						onChange={(_, d) => update({ placeholder: d.value || undefined })}
					/>
				</FieldGroup>
				<Checkbox
					checked={field.required ?? false}
					label="Required"
					onChange={(_, d) => update({ required: d.checked === true })}
				/>
				<Checkbox
					checked={field.disabled ?? false}
					label="Disabled"
					onChange={(_, d) => update({ disabled: d.checked === true })}
				/>
			</CollapsibleSection>

			<CollapsibleSection title="Default Value" classes={classes}>
				<FieldGroup label="Static Value" className={classes.field}>
					<Input
						size="small"
						value={String(field.defaultValue?.value ?? "")}
						onChange={(_, d) =>
							update({
								defaultValue: {
									...field.defaultValue,
									value: d.value || undefined,
								},
							})
						}
					/>
				</FieldGroup>
				<FieldGroup label="Binding" className={classes.field}>
					<BindingEditor
						placeholder="e.g. order.amount"
						bindingPaths={bindingPaths}
						value={field.defaultValue?.binding ?? ""}
						onChange={(v) =>
							update({
								defaultValue: {
									...field.defaultValue,
									binding: v || undefined,
								},
							})
						}
					/>
				</FieldGroup>
			</CollapsibleSection>

			{field.inputType === "number" && (
				<CollapsibleSection title="Number Settings" classes={classes}>
					<FieldGroup label="Step" className={classes.field}>
						<Input
							size="small"
							type="number"
							value={String(field.step ?? 1)}
							onChange={(_, d) =>
								update({ step: d.value ? Number(d.value) : undefined })
							}
						/>
					</FieldGroup>
				</CollapsibleSection>
			)}

			{field.inputType === "textarea" && (
				<CollapsibleSection title="Textarea Settings" classes={classes}>
					<FieldGroup label="Rows" className={classes.field}>
						<Input
							size="small"
							type="number"
							value={String(field.rows ?? 3)}
							onChange={(_, d) =>
								update({ rows: d.value ? Number(d.value) : undefined })
							}
						/>
					</FieldGroup>
				</CollapsibleSection>
			)}

			{hasOptions && (
				<OptionsEditor
					options={field.options ?? []}
					onChange={(options) => update({ options })}
					classes={classes}
				/>
			)}

			<CollapsibleSection
				title="Validation"
				classes={classes}
				defaultExpanded={false}
			>
				<FieldGroup label="Pattern (regex)" className={classes.field}>
					<Input
						size="small"
						value={field.validation?.pattern ?? ""}
						placeholder="e.g. ^[A-Z]+"
						onChange={(_, d) =>
							update({
								validation: {
									...field.validation,
									pattern: d.value || undefined,
								},
							})
						}
					/>
				</FieldGroup>
				<FieldGroup label="Error Message" className={classes.field}>
					<Input
						size="small"
						value={field.validation?.message ?? ""}
						placeholder="Custom error message"
						onChange={(_, d) =>
							update({
								validation: {
									...field.validation,
									message: d.value || undefined,
								},
							})
						}
					/>
				</FieldGroup>
			</CollapsibleSection>
		</>
	);
};

const OptionsEditor = ({
	options,
	onChange,
	classes,
}: {
	options: IFormOption[];
	onChange: (options: IFormOption[]) => void;
	classes: EditorClasses;
}) => {
	const addOption = () => {
		const index = options.length + 1;
		onChange([
			...options,
			{ label: `Option ${index}`, value: `option${index}` },
		]);
	};

	const removeOption = (index: number) => {
		onChange(options.filter((_, i) => i !== index));
	};

	const updateOption = (index: number, partial: Partial<IFormOption>) => {
		onChange(options.map((o, i) => (i === index ? { ...o, ...partial } : o)));
	};

	return (
		<CollapsibleSection title="Options" classes={classes}>
			{options.map((opt, i) => (
				<div key={i} className={classes.columnCard}>
					<div className={classes.columnHeader}>
						<Text size={200} weight="semibold">
							Option {i + 1}
						</Text>
						<Button
							appearance="subtle"
							size="small"
							icon={<DeleteRegular />}
							onClick={() => removeOption(i)}
						/>
					</div>
					<FieldGroup label="Label" className={classes.field}>
						<Input
							size="small"
							value={opt.label}
							onChange={(_, d) => updateOption(i, { label: d.value })}
						/>
					</FieldGroup>
					<FieldGroup label="Value" className={classes.field}>
						<Input
							size="small"
							value={opt.value}
							onChange={(_, d) => updateOption(i, { value: d.value })}
						/>
					</FieldGroup>
				</div>
			))}
			<Button
				className={classes.addColumnBtn}
				appearance="subtle"
				size="small"
				icon={<AddRegular />}
				onClick={addOption}
			>
				Add Option
			</Button>
		</CollapsibleSection>
	);
};
