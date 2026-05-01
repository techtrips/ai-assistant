import type { IChatMessage } from "../AIAssistant.types";

export interface IChatAreaProps {
	messages: IChatMessage[];
	isStreaming: boolean;
	streamingText: string;
	/**
	 * Optional progress label shown next to the typing indicator (e.g.
	 * "Calling SearchContent…"). Empty string hides it.
	 */
	statusLabel?: string;
	totalMessageCount?: number;
	onLoadMore?: () => void;
}
