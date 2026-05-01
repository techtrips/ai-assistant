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

/**
 * Canonical error codes that adapters MAY emit on `ChatEvent.error.code`.
 * The list is open: adapters are free to emit any other string. Consumers
 * should treat unknown codes as opaque and fall back to `message`.
 *
 * Subscribe in `onError` like:
 *   if (event.code === ChatErrorCode.AuthRequired) { ... }
 */
export const ChatErrorCode = {
	/** Upstream rejected the request with 401/403; user should re-supply a token. */
	AuthRequired: "auth-required",
	/** Upstream returned 429 / rate-limit signal. */
	RateLimited: "rate-limited",
	/** The user aborted the request (AbortController). */
	Aborted: "aborted",
	/** Network failure / fetch threw / DNS / CORS. */
	Network: "network",
	/** Upstream 5xx or unhandled server fault. */
	ServerError: "server-error",
	/** Adapter could not classify the failure. */
	Unknown: "unknown",
} as const;

export type ChatErrorCode = (typeof ChatErrorCode)[keyof typeof ChatErrorCode];

/**
 * Allow any of the canonical codes above OR a custom adapter-specific
 * string. The `& {}` trick keeps IDE autocomplete on the known values
 * while still accepting arbitrary strings.
 */
export type ChatErrorCodeLike = ChatErrorCode | (string & {});

export type ChatEvent =
	| { type: "text-delta"; content: string }
	| { type: "text-done"; content?: string; data?: IChatMessageData }
	| {
			type: "error";
			message: string;
			/** Optional machine-readable code. See {@link ChatErrorCode}. */
			code?: ChatErrorCodeLike;
			/** Optional structured payload for the consumer. */
			data?: Record<string, unknown>;
	  };

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
