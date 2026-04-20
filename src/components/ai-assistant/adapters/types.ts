/**
 * Chat adapter abstraction — the single integration point
 * for any AI backend (AG-UI, REST, WebSocket, etc.).
 */

import type { IChatMessageData } from "../AIAssistant.types";

/** Tool call info surfaced by AG-UI adapters for data mapping. */
export interface IToolCallInfo {
	id: string;
	name: string;
	args?: string;
	result?: string;
}

/**
 * Callback that transforms raw tool call results into the library's
 * canonical IChatMessageData. Adapters provide a sensible default;
 * consumers can override for their agent's conventions.
 */
export type MapDataFn = (
	toolCalls: IToolCallInfo[],
) => IChatMessageData | undefined;

export type ChatEvent =
	| { type: "text-delta"; content: string }
	| { type: "text-done"; content?: string; data?: IChatMessageData }
	| { type: "error"; message: string };

export interface ISendMessageRequest {
	threadId: string;
	messageId: string;
	message: string;
	model?: string;
	abortSignal?: AbortSignal;
}

export interface IChatAdapter {
	sendMessage(request: ISendMessageRequest): AsyncIterable<ChatEvent>;
}
