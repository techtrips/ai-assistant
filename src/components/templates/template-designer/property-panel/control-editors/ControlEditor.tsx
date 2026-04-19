import type { ITemplateControl } from "../../../templates.models";
import { ControlType } from "../../../templates.models";
import type { EditorClasses } from "../PropertyPanel.models";
import { FieldEditor } from "./FieldEditor";
import { ButtonEditor } from "./ButtonEditor";
import { BadgeEditor } from "./BadgeEditor";
import { ImageEditor } from "./ImageEditor";
import { ProgressBarEditor } from "./ProgressBarEditor";
import { TableEditor } from "./TableEditor";

export const ControlEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
	bindingData,
	inputFieldInfo = [],
}: {
	control: ITemplateControl;
	onUpdate: (id: string, partial: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
	bindingData: Record<string, unknown>;
	inputFieldInfo?: { name: string; label: string }[];
}) => {
	switch (control.type) {
		case ControlType.Field:
			return (
				<FieldEditor
					control={control}
					onUpdate={onUpdate}
					classes={classes}
					bindingPaths={bindingPaths}
				/>
			);
		case ControlType.Button:
			return (
				<ButtonEditor
					control={control}
					onUpdate={onUpdate}
					classes={classes}
					bindingPaths={bindingPaths}
					inputFieldInfo={inputFieldInfo}
				/>
			);
		case ControlType.Badge:
			return (
				<BadgeEditor
					control={control}
					onUpdate={onUpdate}
					classes={classes}
					bindingPaths={bindingPaths}
				/>
			);
		case ControlType.Image:
			return (
				<ImageEditor
					control={control}
					onUpdate={onUpdate}
					classes={classes}
					bindingPaths={bindingPaths}
				/>
			);
		case ControlType.ProgressBar:
			return (
				<ProgressBarEditor
					control={control}
					onUpdate={onUpdate}
					classes={classes}
					bindingPaths={bindingPaths}
				/>
			);
		case ControlType.Table:
			return (
				<TableEditor
					control={control}
					onUpdate={onUpdate}
					classes={classes}
					bindingPaths={bindingPaths}
					bindingData={bindingData}
				/>
			);
		default:
			return null;
	}
};
