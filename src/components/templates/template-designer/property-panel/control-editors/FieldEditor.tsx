import { Input, Dropdown, Option } from "@fluentui/react-components";
import type {
	ITemplateControl,
	IFieldControl,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import type { EditorClasses } from "../PropertyPanel.models";
import { FIELD_FORMATS } from "../PropertyPanel.models";
import { toPrettyFieldLabel } from "../../TemplateDesigner.utils";

export const FieldEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
}: {
	control: IFieldControl;
	onUpdate: (id: string, p: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
}) => {
	return (
		<CollapsibleSection title="Data" classes={classes}>
			<FieldGroup label="Value" className={classes.field}>
				<Input
					size="small"
					value={String(control.value ?? "")}
					onChange={(_, d) =>
						onUpdate(control.id, { value: d.value } as Partial<IFieldControl>)
					}
				/>
			</FieldGroup>
			<FieldGroup label="Binding" className={classes.field}>
				<BindingEditor
					placeholder="e.g. customer.name"
					bindingPaths={bindingPaths}
					value={control.binding ?? ""}
					onChange={(v) => {
						const nextBinding = v || undefined;
						const currentAutoLabel = toPrettyFieldLabel(control.binding);
						const shouldAutoUpdateLabel =
							!control.label ||
							control.label === "New Field" ||
							control.label === currentAutoLabel;
						const nextLabel =
							shouldAutoUpdateLabel && nextBinding
								? toPrettyFieldLabel(nextBinding)
								: control.label;

						onUpdate(control.id, {
							binding: nextBinding,
							label: nextLabel,
						} as Partial<IFieldControl>);
					}}
				/>
			</FieldGroup>
			<FieldGroup label="Format" className={classes.field}>
				<Dropdown
					size="small"
					value={control.format ?? "text"}
					selectedOptions={[control.format ?? "text"]}
					onOptionSelect={(_, d) =>
						onUpdate(control.id, {
							format: d.optionValue as IFieldControl["format"],
						} as Partial<IFieldControl>)
					}
				>
					{FIELD_FORMATS.map((f) => (
						<Option key={f} value={f}>
							{f}
						</Option>
					))}
				</Dropdown>
			</FieldGroup>
		</CollapsibleSection>
	);
};
