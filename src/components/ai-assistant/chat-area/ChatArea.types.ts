import type { IChatMessage } from "../AIAssistant.types";

export interface IChatAreaProps {
	messages: IChatMessage[];
	isStreaming: boolean;
	streamingText: string;
	totalMessageCount?: number;
	onLoadMore?: () => void;
}
