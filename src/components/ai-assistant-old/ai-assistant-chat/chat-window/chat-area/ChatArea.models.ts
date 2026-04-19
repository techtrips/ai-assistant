import {
	IEntity,
	IAIAssistantConversation,
	IAIAssistantMessage,
	IResolvedTemplate,
	ITemplateInfo,
} from "../../../AIAssistant.models";

export interface IChatAreaProps {
	activeConversation?: IAIAssistantConversation;
	messages?: IEntity<IAIAssistantMessage[]>;
	isDeveloperMode?: boolean;
	isAguiInProgress?: boolean;
	aguiRawData?: string;
	resolveTemplate?: (
		templateInfo: ITemplateInfo | undefined,
		userMessageText: string | undefined,
		payload: unknown,
		customPrompt: string | undefined,
		signal: AbortSignal,
	) => Promise<IResolvedTemplate | undefined>;
}
