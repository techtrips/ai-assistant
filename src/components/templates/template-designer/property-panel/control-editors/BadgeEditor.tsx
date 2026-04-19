import { Input, Dropdown, Option } from "@fluentui/react-components";
import type {
	ITemplateControl,
	IBadgeControl,
	BadgeColor,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import type { EditorClasses } from "../PropertyPanel.models";
import { BADGE_COLORS } from "../PropertyPanel.models";

export const BadgeEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
}: {
	control: IBadgeControl;
	onUpdate: (id: string, p: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
}) => (
	<CollapsibleSection title="Badge" classes={classes}>
		<FieldGroup label="Value" className={classes.field}>
			<Input
				size="small"
				value={control.value ?? ""}
				onChange={(_, d) =>
					onUpdate(control.id, { value: d.value } as Partial<IBadgeControl>)
				}
			/>
		</FieldGroup>
		<FieldGroup label="Binding" className={classes.field}>
			<BindingEditor
				placeholder="e.g. status.label"
				bindingPaths={bindingPaths}
				value={control.binding ?? ""}
				onChange={(v) =>
					onUpdate(control.id, {
						binding: v || undefined,
					} as Partial<IBadgeControl>)
				}
			/>
		</FieldGroup>
		<FieldGroup label="Color" className={classes.field}>
			<Dropdown
				size="small"
				value={control.color ?? "informative"}
				selectedOptions={[control.color ?? "informative"]}
				onOptionSelect={(_, d) =>
					onUpdate(control.id, {
						color: d.optionValue as BadgeColor,
					} as Partial<IBadgeControl>)
				}
			>
				{BADGE_COLORS.map((c) => (
					<Option key={c} value={c}>
						{c}
					</Option>
				))}
			</Dropdown>
		</FieldGroup>
		<FieldGroup label="Color Binding" className={classes.field}>
			<BindingEditor
				placeholder="e.g. status.color"
				bindingPaths={bindingPaths}
				value={control.colorBinding ?? ""}
				onChange={(v) =>
					onUpdate(control.id, {
						colorBinding: v || undefined,
					} as Partial<IBadgeControl>)
				}
			/>
		</FieldGroup>
	</CollapsibleSection>
);
