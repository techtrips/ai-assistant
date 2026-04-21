import { createContext, useContext } from "react";
import type { IChatMessage } from "./AIAssistant.types";
import type {
	AIAssistantPermission,
	IAIAssistantSettings,
} from "./AIAssistant.types";
import type { IStarterPrompt } from "./AIAssistant.types";
import type { IAIAssistantService } from "./AIAssistant.services";

type SetMessagesAction =
	| IChatMessage[]
	| ((prev: IChatMessage[]) => IChatMessage[]);

export interface IAIAssistantContextValue {
	sendMessage: (text: string) => void;
	selectPrompt: (prompt: IStarterPrompt) => void;
	activeParameterizedPrompt: IStarterPrompt | null;
	dismissParameterizedPrompt: () => void;
	newChat: () => void;
	selectConversation: (threadId: string) => Promise<void>;
	messages: IChatMessage[];
	setMessages: (action: SetMessagesAction) => void;
	threadId: string;
	setThreadId: (id: string) => void;
	totalMessageCount: number;
	loadOlderMessages: () => void;
	service?: IAIAssistantService;
	permissions?: AIAssistantPermission[];
	agentNames: string[];
	starterPrompts: IStarterPrompt[];
	starterPromptsLoading: boolean;
	refreshStarterPrompts: () => void;
	theme: "light" | "dark";
	settings: IAIAssistantSettings;
	updateSettings: (
		user: Partial<IAIAssistantSettings>,
		global: Partial<IAIAssistantSettings>,
	) => void;
}

export const AIAssistantContext = createContext<
	IAIAssistantContextValue | undefined
>(undefined);

export const useAIAssistantContext = (): IAIAssistantContextValue => {
	const ctx = useContext(AIAssistantContext);
	if (!ctx)
		throw new Error("useAIAssistantContext must be used within <AIAssistant>");
	return ctx;
};
