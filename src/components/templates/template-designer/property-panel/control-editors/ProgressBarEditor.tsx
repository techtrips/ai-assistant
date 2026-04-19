import { SpinButton } from "@fluentui/react-components";
import type {
	ITemplateControl,
	IProgressBarControl,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import type { EditorClasses } from "../PropertyPanel.models";

export const ProgressBarEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
}: {
	control: IProgressBarControl;
	onUpdate: (id: string, p: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
}) => (
	<CollapsibleSection title="Progress" classes={classes}>
		<FieldGroup label="Value" className={classes.field}>
			<SpinButton
				size="small"
				value={control.value ?? 0}
				min={0}
				onChange={(_, d) =>
					onUpdate(control.id, {
						value: d.value ?? 0,
					} as Partial<IProgressBarControl>)
				}
			/>
		</FieldGroup>
		<FieldGroup label="Binding" className={classes.field}>
			<BindingEditor
				placeholder="e.g. progress.percent"
				bindingPaths={bindingPaths}
				value={control.binding ?? ""}
				onChange={(v) =>
					onUpdate(control.id, {
						binding: v || undefined,
					} as Partial<IProgressBarControl>)
				}
			/>
		</FieldGroup>
		<FieldGroup label="Max" className={classes.field}>
			<SpinButton
				size="small"
				value={control.max ?? 100}
				min={1}
				onChange={(_, d) =>
					onUpdate(control.id, {
						max: d.value ?? 100,
					} as Partial<IProgressBarControl>)
				}
			/>
		</FieldGroup>
	</CollapsibleSection>
);
