import { Checkbox } from "@fluentui/react-components";
import type {
	ITemplateControl,
	IButtonControl,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import type { EditorClasses } from "../PropertyPanel.models";
import { ActionBindingInput } from "./binding-editor/ActionBindingInput";

export const ButtonEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
	inputFieldInfo = [],
}: {
	control: IButtonControl;
	onUpdate: (id: string, p: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
	inputFieldInfo?: { name: string; label: string }[];
}) => {
	const inputFieldPaths = inputFieldInfo.map((f) => f.name);
	const pathLabels = Object.fromEntries(
		inputFieldInfo.map((f) => [f.name, f.label]),
	);

	return (
		<CollapsibleSection title="Action" classes={classes}>
			<FieldGroup label="Prompt" className={classes.field}>
				<ActionBindingInput
					placeholder="e.g. Show details for order {orderId}"
					bindingPaths={inputFieldPaths}
					globalBindingPaths={bindingPaths}
					pathLabels={pathLabels}
					value={control.prompt}
					onChange={(v) =>
						onUpdate(control.id, { prompt: v } as Partial<IButtonControl>)
					}
				/>
			</FieldGroup>
			{inputFieldInfo.length > 0 && (
				<FieldGroup label="" className={classes.field}>
					<Checkbox
						label="Validate form before action"
						checked={control.validateForm ?? false}
						onChange={(_, data) =>
							onUpdate(control.id, {
								validateForm: !!data.checked,
							} as Partial<IButtonControl>)
						}
					/>
				</FieldGroup>
			)}
		</CollapsibleSection>
	);
};
