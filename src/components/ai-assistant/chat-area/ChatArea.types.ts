import type { IActivityEvent, IChatMessage } from "../AIAssistant.types";

export interface IChatAreaProps {
	messages: IChatMessage[];
	isStreaming: boolean;
	streamingText: string;
	/**
	 * Optional progress label shown next to the typing indicator (e.g.
	 * "Calling SearchContent…"). Empty string hides it.
	 */
	statusLabel?: string;
	/**
	 * Live, in-order activity entries captured during the current stream.
	 * Rendered as a collapsible "Activity" panel above the streaming bubble.
	 */
	streamingActivities?: IActivityEvent[];
	/**
	 * True when the current run has invoked at least one tool. Drives
	 * suppression of the streaming markdown bubble (since tool replies
	 * resolve to a card / template, swapping mid-stream looks jarring).
	 * Independent of `streamingActivities`, which may be empty when the
	 * `showAgentActivity` setting is off.
	 */
	hasToolActivity?: boolean;
	totalMessageCount?: number;
	onLoadMore?: () => void;
}
