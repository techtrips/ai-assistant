import {
	IAIAssistantMessage,
	ITemplateInfo,
} from "../../../../AIAssistant.models";

export interface IDynamicTemplateRendererProps {
	getTemplate?: (params: ITemplateInfo) => any;
	message: IAIAssistantMessage;
	userMessageText?: string;
	renderDynamicTemplate?: (
		userMessageText: string | undefined,
		payload: unknown,
		customPrompt: string | undefined,
		signal: AbortSignal,
	) => Promise<string | undefined>;
}
