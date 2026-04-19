import type { IAIAssistantTemplate } from "../TemplatePage.models";

export interface ITemplateDesignProps {
	template: IAIAssistantTemplate;
	isLoading?: boolean;
	isReadOnly?: boolean;
	error?: string;
	onSave: (template: IAIAssistantTemplate) => Promise<void>;
	onClose: () => void;
}
