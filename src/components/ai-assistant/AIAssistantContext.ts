import { createContext, useContext } from "react";
import type { IChatMessage } from "./AIAssistant.types";
import type { AIAssistantPermission } from "./AIAssistant.types";
import type { IStarterPrompt } from "./AIAssistant.types";
import type { IAIAssistantService } from "./AIAssistant.services";

export interface IAIAssistantContextValue {
	sendMessage: (text: string) => void;
	newChat: () => void;
	messages: IChatMessage[];
	setMessages: (messages: IChatMessage[]) => void;
	threadId: string;
	setThreadId: (id: string) => void;
	service?: IAIAssistantService;
	permissions?: AIAssistantPermission[];
	agentNames: string[];
	starterPrompts: IStarterPrompt[];
	theme: "light" | "dark";
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
