import type { ReactNode } from "react";
import type { IChatMessage } from "../AIAssistant.types";

export interface IChatAreaProps {
	messages: IChatMessage[];
	isStreaming: boolean;
	streamingText: string;
	renderMessage?: (message: IChatMessage) => ReactNode;
}
