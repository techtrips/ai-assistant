import type {
	IEntity,
	IAIAssistantAgent,
	IAIAssistantTemplate,
} from "../../AIAssistant.models";

// Re-export shared types so sub-components don't import AIAssistant directly
export type { IEntity, IAIAssistantAgent, IAIAssistantTemplate };

export enum TemplatePageActionType {
	Create = "Create",
	Update = "Update",
	Delete = "Delete",
	Fetch = "Fetch",
}

export interface ITemplatePageState {
	templates: IEntity<IAIAssistantTemplate[]>;
	/** undefined = closed, null = create, object = edit */
	formPanelTarget: IAIAssistantTemplate | null | undefined;
	designPanelTarget: IAIAssistantTemplate | null;
	deleteTarget: IAIAssistantTemplate | null;
	deleteError: string;
	isDeleting: boolean;
	isPanelLoading: boolean;
	panelError: string;
	searchQuery: string;
}

export interface ITemplatePageProps {
	agents?: IAIAssistantAgent[];
	isSidebar?: boolean;
	initialData?: IEntity<IAIAssistantTemplate[]>;
	onClose?: () => void;
}
