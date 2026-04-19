import type { ITemplate } from "../../templates.models";
import { ControlType } from "../../templates.models";
import type { ISelectedElement } from "../TemplateDesigner.models";
import type { IDragItem, IDropTarget } from "../TemplateDesigner.actions";

export interface ITemplateTreeViewProps {
	template: ITemplate;
	selectedElement?: ISelectedElement;
	onSelectElement: (element: ISelectedElement) => void;
	onAddSection: (parentSectionId?: string) => void;
	onRemoveSection: (sectionId: string) => void;
	onAddControl: (sectionId: string, controlType: ControlType) => void;
	onRemoveControl: (sectionId: string, controlId: string) => void;
	onAddControlToCard: (controlType: ControlType) => void;
	onRemoveControlFromCard: (controlId: string) => void;
	onMoveNode: (drag: IDragItem, drop: IDropTarget) => void;
}

export const CONTROL_LABELS: Record<ControlType, string> = {
	[ControlType.Field]: "Field",
	[ControlType.Button]: "Button",
	[ControlType.Table]: "Table",
	[ControlType.Badge]: "Badge",
	[ControlType.Image]: "Image",
	[ControlType.ProgressBar]: "Progress",
	[ControlType.InputField]: "Input Field",
	[ControlType.Separator]: "Separator",
};
