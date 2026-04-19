import { createContext, useContext } from "react";
import { IAiAssistantContextValue } from "./AIAssistant.models";

export const AiAssistantContext = createContext<
	IAiAssistantContextValue | undefined
>(undefined);

export const useAiAssistantContext = (): IAiAssistantContextValue => {
	const context = useContext(AiAssistantContext);
	if (!context) {
		throw new Error(
			"useAiAssistantContext must be used within an AiAssistantContextProvider",
		);
	}
	return context;
};
