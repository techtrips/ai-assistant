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
	  }
	/**
	 * Progress update emitted while the agent is working — e.g. "Calling
	 * SearchContent…", "Thinking…", "Step 2 of 3". Hosts render this next
	 * to the typing indicator so the user sees what the agent is doing.
	 *
	 * Adapters should emit a `status` with an empty `label` (or `done: true`)
	 * to clear the indicator. The host also auto-clears on the next
	 * `text-delta` / `text-done` / `error`.
	 */
	| {
			type: "status";
			/** Human-readable activity label. Empty string clears the indicator. */
			label: string;
			/** Optional stable key for deduping repeat events. */
			key?: string;
			/** When `true`, treated as an explicit clear regardless of `label`. */
			done?: boolean;
			/**
			 * Optional structured detail (args / result preview) to surface
			 * in the activity timeline when the user expands the row.
			 */
			detail?: string;
	  };

/**
 * A single prior turn from the conversation, in adapter-friendly form.
 * Adapters that talk to a stateless backend (REST, custom agent, etc.) can
 * forward this so the agent has context of the conversation so far. Adapters
 * for stateful backends that already persist history server-side (AG-UI with
 * a `ChatHistoryProvider`, for example) can ignore it.
 */
export interface IChatHistoryEntry {
	role: "user" | "assistant";
	content: string;
}

export interface ISendMessageRequest {
	threadId: string;
	messageId: string;
	message: string;
	model?: string;
	abortSignal?: AbortSignal;
	/**
	 * Prior conversation turns (oldest → newest), excluding the current
	 * `message`. Already trimmed by the host to a recency window so adapters
	 * don't need to re-cap.
	 */
	history?: ReadonlyArray<IChatHistoryEntry>;
	/**
	 * When false, adapters should skip building rich per-event detail
	 * payloads (tool args, tool results, reasoning buffers, etc.) since
	 * the host UI is not surfacing them. Defaults to true.
	 */
	captureActivityDetails?: boolean;
}

export interface IChatAdapter {
	sendMessage(request: ISendMessageRequest): AsyncIterable<ChatEvent>;
}
