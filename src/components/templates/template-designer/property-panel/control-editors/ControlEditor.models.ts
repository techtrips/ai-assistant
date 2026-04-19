import type { ITemplateControl } from "../../../templates.models";
import type { EditorClasses } from "../PropertyPanel.models";

export interface IControlEditorProps {
	control: ITemplateControl;
	onUpdate: (id: string, partial: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
	bindingData: Record<string, unknown>;
}
