import type { IAIAssistantStarterPrompt } from "../../../AIAssistant.models";

export type { IAIAssistantStarterPrompt };

export interface IStarterPromptFormState {
	agentName: string;
	parameters: string[];
	prompt: string;
	tags: string[];
	title: string;
}

export interface IStarterPromptFormProps {
	/** null = create mode, object = edit mode */
	prompt: IAIAssistantStarterPrompt | null;
	isSidebar?: boolean;
	loading?: boolean;
	agents: string[];
	panelError: string;
	onSave: (prompt: IAIAssistantStarterPrompt) => Promise<void>;
	onClose: () => void;
}
