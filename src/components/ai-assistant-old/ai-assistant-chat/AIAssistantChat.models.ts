import {
	AIAssistantActionType,
	AIAssistantFeature,
	IEntity,
	IAIAssistantConversation,
	IAIAssistantMessage,
	IAIAssistantModel,
	IAIAssistantStarterPrompt,
	IAIAssistantTemplate,
	IAssistantBasicProps,
	IResolvedTemplate,
	ITemplateInfo,
} from "../AIAssistant.models";

export enum AssistantChatNavItem {
	NewChat = "NewChat",
	Chats = "Chats",
	StarterPrompts = "StarterPrompts",
	Templates = "Templates",
	Settings = "Settings",
}

export interface IAssistantChatProps extends IAssistantBasicProps {
	className?: string;
	models?: IEntity<IAIAssistantModel[]>;
	selectedModel?: IAIAssistantModel;
	starterPrompts?: IEntity<IAIAssistantStarterPrompt[]>;
	templates?: IEntity<IAIAssistantTemplate[]>;
	conversationHistory?: IEntity<IAIAssistantConversation[]>;
	activeConversationMessages?: IEntity<IAIAssistantMessage[]>;
	isAguiInProgress?: boolean;
	aguiRawData?: string;
	onToggleDisplayMode?: () => void;
	onAction?: (
		action: AIAssistantActionType,
		payload?: unknown,
	) => Promise<unknown> | void;
	activeConversation?: IAIAssistantConversation;
	resolveTemplate?: (
		templateInfo: ITemplateInfo | undefined,
		userMessageText: string | undefined,
		payload: unknown,
		customPrompt: string | undefined,
		signal: AbortSignal,
	) => Promise<IResolvedTemplate | undefined>;
	features?: AIAssistantFeature[];
}
