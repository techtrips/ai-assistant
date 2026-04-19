import {
	IAIAssistantMessage,
	IResolvedTemplate,
	ITemplateInfo,
} from "../../../../AIAssistant.models";

export type ResolveTemplateFn = (
	templateInfo: ITemplateInfo | undefined,
	userMessageText: string | undefined,
	payload: unknown,
	customPrompt: string | undefined,
	signal: AbortSignal,
) => Promise<IResolvedTemplate | undefined>;

export interface IMessageRendererProps {
	message: IAIAssistantMessage;
	userMessageText?: string;
	resolveTemplate?: ResolveTemplateFn;
	cachedResolved?: IResolvedTemplate;
	onResolved?: (messageId: string, result: IResolvedTemplate) => void;
}

export interface IUseResolveTemplateOptions {
	messageId: string | undefined;
	payload: unknown;
	userMessageText: string | undefined;
	resolveTemplate: ResolveTemplateFn | undefined;
	skip: boolean;
	cachedResolved?: IResolvedTemplate;
	onResolved?: (messageId: string, result: IResolvedTemplate) => void;
}

export interface IUseResolveTemplateResult {
	resolved: IResolvedTemplate | undefined;
	isLoading: boolean;
	templateData: Record<string, unknown>;
}
