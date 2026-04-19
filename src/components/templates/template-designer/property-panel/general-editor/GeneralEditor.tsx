import { Input, Switch, Dropdown, Option } from "@fluentui/react-components";
import type {
	ITemplateControl,
	IButtonControl,
	ButtonAppearance,
	ButtonPlacement,
} from "../../../templates.models";
import { ControlType } from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import type { EditorClasses } from "../PropertyPanel.models";
import {
	BUTTON_APPEARANCES,
	BUTTON_PLACEMENT_OPTIONS,
} from "../PropertyPanel.models";
import { IconPickerDialog } from "../../../common/icons/IconPickerDialog";

export const GeneralEditor = ({
	control,
	onUpdate,
	classes,
}: {
	control: ITemplateControl;
	onUpdate: (id: string, partial: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
}) => {
	const isButton = control.type === ControlType.Button;
	const btn = isButton ? (control as IButtonControl) : undefined;

	return (
		<CollapsibleSection title="General" classes={classes}>
			<FieldGroup label="ID" className={classes.field}>
				<Input size="small" value={control.id} readOnly />
			</FieldGroup>
			<FieldGroup label="Label" className={classes.field}>
				<Input
					size="small"
					value={control.label ?? ""}
					onChange={(_, d) => onUpdate(control.id, { label: d.value })}
				/>
			</FieldGroup>
			<div className={classes.row}>
				<Switch
					label="Visible"
					checked={control.visible ?? true}
					onChange={(_, d) => onUpdate(control.id, { visible: d.checked })}
				/>
				<Switch
					label="Disabled"
					checked={control.disabled ?? false}
					onChange={(_, d) => onUpdate(control.id, { disabled: d.checked })}
				/>
			</div>
			{btn && (
				<>
					<FieldGroup label="Appearance" className={classes.field}>
						<Dropdown
							size="small"
							value={btn.appearance ?? "secondary"}
							selectedOptions={[btn.appearance ?? "secondary"]}
							onOptionSelect={(_, d) =>
								onUpdate(control.id, {
									appearance: d.optionValue as ButtonAppearance,
								} as Partial<IButtonControl>)
							}
						>
							{BUTTON_APPEARANCES.map((a) => (
								<Option key={a} value={a}>
									{a}
								</Option>
							))}
						</Dropdown>
					</FieldGroup>
					<FieldGroup label="Icon" className={classes.field}>
						<IconPickerDialog
							value={btn.iconName}
							onChange={(iconName) =>
								onUpdate(control.id, { iconName } as Partial<IButtonControl>)
							}
						/>
					</FieldGroup>
					<FieldGroup label="Tooltip" className={classes.field}>
						<Input
							size="small"
							placeholder="Hover text for icon-only"
							value={btn.tooltip ?? ""}
							onChange={(_, d) =>
								onUpdate(control.id, {
									tooltip: d.value,
								} as Partial<IButtonControl>)
							}
						/>
					</FieldGroup>
					<FieldGroup label="Placement" className={classes.field}>
						<Dropdown
							size="small"
							value={btn.placement ?? "inline"}
							selectedOptions={[btn.placement ?? "inline"]}
							onOptionSelect={(_, d) =>
								onUpdate(control.id, {
									placement: d.optionValue as ButtonPlacement,
								} as Partial<IButtonControl>)
							}
						>
							{BUTTON_PLACEMENT_OPTIONS.map((p) => (
								<Option key={p} value={p}>
									{p}
								</Option>
							))}
						</Dropdown>
					</FieldGroup>
				</>
			)}
		</CollapsibleSection>
	);
};
