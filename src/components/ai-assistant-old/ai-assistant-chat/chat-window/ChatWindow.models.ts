import {
	IEntity,
	IAIAssistantConversation,
	IAIAssistantMessage,
	IAIAssistantModel,
	IAIAssistantStarterPrompt,
	IResolvedTemplate,
	ITemplateInfo,
} from "../../AIAssistant.models";

export interface IChatWindowEvents {
	onSelectStarterPrompt: (prompt: IAIAssistantStarterPrompt) => void;
	onPromptFormSubmit?: (resolvedPrompt: string) => void;
	onPromptFormCancel?: () => void;
	onInputChange: (input: string) => void;
	onModelChange: (modelId: string) => void;
	onFileUpload: (file: File) => void;
	onFileRemove: (fileId: string) => void;
	onSendMessage: () => void;
	onCancelMessage: () => void;
}

export interface IChatWindowProps {
	models?: IEntity<IAIAssistantModel[]>;
	selectedModel?: IAIAssistantModel;
	activeConversation?: IAIAssistantConversation;
	activeConversationMessages?: IEntity<IAIAssistantMessage[]>;
	inputValue: string;
	starterPrompts: IEntity<IAIAssistantStarterPrompt[]>;
	isDeveloperMode: boolean;
	isAguiInProgress?: boolean;
	aguiRawData?: string;
	activeParameterizedPrompt?: IAIAssistantStarterPrompt | null;
	focusTrigger?: number;
	events: IChatWindowEvents;
	resolveTemplate?: (
		templateInfo: ITemplateInfo | undefined,
		userMessageText: string | undefined,
		payload: unknown,
		customPrompt: string | undefined,
		signal: AbortSignal,
	) => Promise<IResolvedTemplate | undefined>;
}
