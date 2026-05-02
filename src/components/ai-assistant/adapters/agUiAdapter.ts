import { HttpAgent } from "@ag-ui/client";
import type { Message, RunAgentInput } from "@ag-ui/core";
import type { IChatMessageData } from "../AIAssistant.types";
import { defaultMapData } from "./agUiAdapter.helpers";
import { buildAguiSubscriber } from "./agUiAdapter.subscriber";
import { buildAuthHeaders } from "./http";
import type {
	ChatEvent,
	IChatAdapter,
	ISendMessageRequest,
	IToolCallInfo,
	MapDataFn,
} from "./types";

// Re-export so existing consumers importing from this module path don't
// need to change their imports.
export { defaultMapData } from "./agUiAdapter.helpers";

/**
 * Configuration for {@link agUiAdapter}.
 */
export interface AgUiAdapterOptions {
	/**
	 * Fully-qualified URL of the AG-UI server endpoint (e.g.
	 * `https://agent.example.com/agui`).
	 */
	url: string;
	/**
	 * Async resolver for the bearer token sent on every request. Called
	 * once per `sendMessage`. If it rejects (or returns ""), the call
	 * proceeds unauthenticated and the server's response will determine
	 * the error surface (typically a 401 surfaced as a typed `error`
	 * event in the stream).
	 *
	 * Set `onTokenError` to react to token-fetch failures explicitly.
	 */
	getToken: () => Promise<string>;
	/**
	 * Transform raw tool call results into the library's canonical
	 * {@link IChatMessageData} shape. Default: tool results → `payload`
	 * (stringified), first tool name → `templateId`. Override for agents
	 * whose conventions differ.
	 */
	mapData?: MapDataFn;
	/**
	 * When `true`, prior conversation turns from `request.history` are
	 * sent with each AG-UI run. Use this for stateless AG-UI servers
	 * that don't persist history themselves.
	 *
	 * Default `false`: most AG-UI servers attach a `ChatHistoryProvider`
	 * keyed by `threadId` and rehydrate prior turns server-side. Forwarding
	 * history in that setup would duplicate every turn.
	 */
	forwardHistory?: boolean;
	/**
	 * When `true`, every AG-UI event is logged to the console as
	 * `[agui] <EVENT_TYPE>` along with its raw payload. Useful for
	 * diagnosing missing status labels — if you only see `RUN_STARTED`
	 * and `TEXT_MESSAGE_*` events, the agent isn't emitting any tool /
	 * step / reasoning / activity events the chip can surface.
	 */
	debug?: boolean;
	/**
	 * Optional hook invoked when {@link AgUiAdapterOptions.getToken}
	 * rejects. Receives the original error so the host can surface it
	 * (toast, telemetry, re-auth flow). The adapter still proceeds with
	 * an empty token after invoking this hook.
	 */
	onTokenError?: (error: unknown) => void;
}

/**
 * Extended `HttpAgent` that injects an arbitrary `model` field into the
 * POST body so the AG-UI server can route to the requested model.
 */
class ExtendedHttpAgent extends HttpAgent {
	public model?: string;

	protected override requestInit(input: RunAgentInput): RequestInit {
		const base = super.requestInit(input);
		const body = typeof base.body === "string" ? JSON.parse(base.body) : {};
		if (this.model) {
			body.model = this.model;
		}
		return { ...base, body: JSON.stringify(body) };
	}
}

/**
 * Creates an {@link IChatAdapter} backed by the AG-UI protocol.
 *
 * ```ts
 * const adapter = agUiAdapter({
 *   url: "https://agent.example.com/agui",
 *   getToken: async () => msalToken,
 * });
 * ```
 *
 * Each `sendMessage` call constructs a fresh `HttpAgent` instance — the
 * AG-UI client mutates `agent.threadId`, `agent.headers`, and
 * `agent.messages` per run, so reusing one across concurrent invocations
 * would race on those fields.
 */
export const agUiAdapter = (options: AgUiAdapterOptions): IChatAdapter => {
	if (options.debug) {
		// eslint-disable-next-line no-console
		console.log("%c[agui] adapter created", "color:#0a7;font-weight:bold", {
			url: options.url,
		});
	}
	return {
		async *sendMessage(
			request: ISendMessageRequest,
		): AsyncGenerator<ChatEvent> {
			if (options.debug) {
				// eslint-disable-next-line no-console
				console.log(
					"%c[agui] sendMessage",
					"color:#0a7;font-weight:bold",
					request.messageId,
				);
			}
			const agent = new ExtendedHttpAgent({ url: options.url });

			let token = "";
			try {
				token = await options.getToken();
			} catch (err) {
				options.onTokenError?.(err);
				if (options.debug) {
					// eslint-disable-next-line no-console
					console.warn("[agui] getToken rejected", err);
				}
			}

			// When the host UI has activity-details disabled we skip the
			// JSON parse/stringify work entirely so large payloads don't
			// hit the main thread per tool/activity event.
			const captureDetails = request.captureActivityDetails !== false;

			agent.threadId = request.threadId;
			agent.headers = await buildAuthHeaders(
				token ? async () => token : undefined,
				options.onTokenError,
			);
			agent.model = request.model;

			const messages: Message[] = [];
			if (options.forwardHistory && request.history) {
				let i = 0;
				for (const turn of request.history) {
					messages.push({
						id: `${request.messageId}-h${i++}`,
						role: turn.role,
						content: turn.content,
					});
				}
			}
			messages.push({
				id: request.messageId,
				role: "user",
				content: request.message,
			});
			agent.setMessages(messages);

			// Bridge the callback-based subscriber to async iteration.
			// Head index instead of `Array.shift` (O(n)) so chatty agents
			// don't degrade as the queue grows.
			type QueueItem = ChatEvent | null; // null = done
			const queue: QueueItem[] = [];
			let head = 0;
			let resolve: (() => void) | null = null;
			let finished = false;

			const push = (item: QueueItem) => {
				queue.push(item);
				if (resolve) {
					const r = resolve;
					resolve = null;
					r();
				}
			};

			let textEndReceived = false;
			let streamedText = "";
			// AG-UI emits both `onRunErrorEvent` (server-side) and
			// `onRunFailed` (terminal failure of the run promise) for the
			// same failure. Only surface one.
			let errorPushed = false;
			const toolCalls = new Map<string, IToolCallInfo>();
			const mapData = options.mapData ?? defaultMapData;

			const subscriber = buildAguiSubscriber({
				push: (event) => push(event),
				captureDetails,
				toolCalls,
				debug: options.debug,
				onTextDelta: (delta) => {
					streamedText += delta;
				},
				markErrorPushed: () => {
					if (errorPushed) return false;
					errorPushed = true;
					return true;
				},
				markTextEnd: () => {
					textEndReceived = true;
				},
			});

			// Abort relay: a single AbortController owned by this run, with the
			// consumer's signal forwarded via `addEventListener('abort', ..., { once: true, signal })`.
			// Passing the local controller's signal as the listener-removal
			// signal means the listener is GC-eligible the instant the run
			// settles, even if the consumer never aborts.
			const abortController = new AbortController();
			if (request.abortSignal) {
				if (request.abortSignal.aborted) {
					abortController.abort();
				} else {
					request.abortSignal.addEventListener(
						"abort",
						() => abortController.abort(),
						{ once: true, signal: abortController.signal },
					);
				}
			}

			const buildData = (): IChatMessageData | undefined => {
				if (toolCalls.size === 0) return undefined;
				return mapData([...toolCalls.values()]);
			};

			if (options.debug) {
				// eslint-disable-next-line no-console
				console.log(
					"%c[agui] runAgent →",
					"color:#0a7;font-weight:bold",
					options.url,
					{ threadId: agent.threadId, model: agent.model },
				);
			}
			const runPromise = agent
				.runAgent({ abortController }, subscriber)
				.then((result) => {
					if (options.debug) {
						// eslint-disable-next-line no-console
						console.log(
							"%c[agui] runAgent resolved",
							"color:#0a7;font-weight:bold",
							result,
						);
					}
					// Fallback: streaming path didn't deliver text — pull
					// the assistant text from `result.newMessages`.
					if (!textEndReceived) {
						const msgs = result.newMessages ?? [];
						const assistantText = msgs
							.filter((m: Message) => m.role === "assistant")
							.map((m: Message) => (m as { content?: string }).content ?? "")
							.join("\n")
							.trim();
						if (assistantText) {
							streamedText = assistantText;
						}
					}
				})
				.catch((err: Error) => {
					if (options.debug) {
						// eslint-disable-next-line no-console
						console.error("%c[agui] runAgent rejected", "color:#d22", err);
					}
					if (err.name !== "AbortError" && !errorPushed) {
						errorPushed = true;
						push({ type: "error", message: err.message });
					}
				})
				.finally(() => {
					const data = buildData();
					if (streamedText || data) {
						push({
							type: "text-done",
							content: streamedText || undefined,
							data,
						});
					}
					finished = true;
					push(null);
				});

			// Yield events as they arrive
			while (true) {
				if (head < queue.length) {
					const item = queue[head];
					queue[head] = null as unknown as QueueItem; // free reference
					head++;
					// Periodically reclaim head slack to keep memory flat
					// for very long streams (thousands of events).
					if (head > 256 && head * 2 > queue.length) {
						queue.splice(0, head);
						head = 0;
					}
					if (item === null) break;
					yield item;
				} else if (finished) {
					break;
				} else {
					await new Promise<void>((r) => {
						resolve = r;
					});
				}
			}

			await runPromise;
		},
	};
};
