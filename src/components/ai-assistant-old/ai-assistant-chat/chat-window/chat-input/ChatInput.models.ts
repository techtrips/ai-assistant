import { IEntity } from "../../../../../models/common.models";
import {
	IAIAssistantModel,
	IAIAssistantStarterPrompt,
} from "../../../AIAssistant.models";

export interface IChatInputProps {
	models?: IEntity<IAIAssistantModel[]>;
	selectedModel?: IAIAssistantModel;
	inputValue: string;
	starterPrompts: IEntity<IAIAssistantStarterPrompt[]>;
	isPromptProcessing: boolean;
	focusTrigger?: number;
	onSelectStarterPrompt: (prompt: IAIAssistantStarterPrompt) => void;
	onInputChange: (input: string) => void;
	onModelChange: (modelId: string) => void;
	onFileUpload: (file: File) => void;
	onFileRemove: (fileId: string) => void;
	onSendMessage: () => void;
	onCancelMessage: () => void;
}

export interface IChatInputState {
	isRecording: boolean;
	inputValue: string;
	selectedModel: string;
}
