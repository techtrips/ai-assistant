import type {
	IAIAssistantAgent,
	IAIAssistantTemplate,
} from "../TemplatePage.models";

export interface ITemplateFormProps {
	template: IAIAssistantTemplate | null;
	agents?: IAIAssistantAgent[];
	isSidebar?: boolean;
	isLoading?: boolean;
	error?: string;
	onSave: (template: IAIAssistantTemplate) => Promise<void>;
	onClose: () => void;
}

export interface ITemplateFormState {
	name: string;
	description: string;
	agents: string[];
}
