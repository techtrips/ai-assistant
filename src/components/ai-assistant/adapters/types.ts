/**
 * Chat adapter abstraction — the single integration point
 * for any AI backend (AG-UI, REST, WebSocket, etc.).
 */

export type ChatEvent =
	| { type: "text-delta"; content: string }
	| { type: "text-done"; content: string; data?: Record<string, unknown> }
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
