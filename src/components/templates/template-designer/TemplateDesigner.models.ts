import type { ITemplate } from "../templates.models";

export interface IEntity<T> {
	data?: T;
	loading?: boolean;
	error?: string;
}

export enum TemplateDesignerMode {
	Design = "design",
	Preview = "preview",
	JSON = "json",
}

export interface ISelectedElement {
	type: "card" | "section" | "control";
	id: string;
}

export interface ITemplateDesignerProps {
	template?: ITemplate | Record<string, unknown> | string;
	dataSource?: Record<string, unknown> | string;
	isReadOnly?: boolean;
	onSave?: (
		template: ITemplate,
		templateDataSource?: Record<string, unknown> | string,
	) => void;
	onClose?: () => void;
}

export enum TemplateDesignerActionType {
	Save = "Save",
	Cancel = "Cancel",
	AddSection = "AddSection",
	RemoveSection = "RemoveSection",
	AddControl = "AddControl",
	RemoveControl = "RemoveControl",
	UpdateCard = "UpdateCard",
	UpdateSection = "UpdateSection",
	UpdateControl = "UpdateControl",
	SelectElement = "SelectElement",
	SetMode = "SetMode",
}

export interface ITemplateDesignerState {
	template: IEntity<ITemplate>;
	mode: TemplateDesignerMode;
	selectedElement?: ISelectedElement;
	isDirty: boolean;
	bindingPaths: string[];
	bindingData: Record<string, unknown>;
}
