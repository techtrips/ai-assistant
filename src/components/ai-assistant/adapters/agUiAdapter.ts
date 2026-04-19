import { HttpAgent } from "@ag-ui/client";
import type { AgentSubscriber } from "@ag-ui/client";
import type { RunAgentInput, Message } from "@ag-ui/core";
import type { IChatAdapter, ChatEvent, ISendMessageRequest } from "./types";

interface AgUiAdapterOptions {
	url: string;
	getToken: () => Promise<string>;
}

/**
 * Extended HttpAgent that injects `model` into the POST body.
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
 * Creates a ChatAdapter backed by the AG-UI protocol.
 *
 * Usage:
 * ```ts
 * const adapter = agUiAdapter({ url: "https://agent.example.com/agui", getToken });
 * ```
 */
export const agUiAdapter = (options: AgUiAdapterOptions): IChatAdapter => {
	let agent: ExtendedHttpAgent | undefined;

	return {
		async *sendMessage(
			request: ISendMessageRequest,
		): AsyncGenerator<ChatEvent> {
			if (!agent) {
				agent = new ExtendedHttpAgent({ url: options.url });
			}

			const token = await options.getToken().catch(() => "");

			agent.threadId = request.threadId;
			agent.headers = token ? { Authorization: `Bearer ${token}` } : {};
			agent.model = request.model;

			const userMessage: Message = {
				id: request.messageId,
				role: "user",
				content: request.message,
			};
			agent.setMessages([userMessage]);

			// Use a queue to bridge the callback-based subscriber to async iteration
			type QueueItem = ChatEvent | null; // null = done
			const queue: QueueItem[] = [];
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
			const toolCalls = new Map<
				string,
				{
					id: string;
					name: string;
					args?: string;
					result?: string;
				}
			>();

			const subscriber: AgentSubscriber = {
				onTextMessageStartEvent: () => {},
				onTextMessageContentEvent: (params) => {
					const delta = params.event.delta ?? "";
					streamedText += delta;
					push({ type: "text-delta", content: delta });
				},
				onTextMessageEndEvent: () => {
					textEndReceived = true;
				},
				onRunErrorEvent: (params) => {
					push({ type: "error", message: params.event.message });
				},
				onRunFailed: (params) => {
					push({ type: "error", message: params.error.message });
				},
				onRunFinishedEvent: () => {
					// will be marked done after runAgent resolves
				},
				onToolCallStartEvent: (params) => {
					const id = params.event.toolCallId;
					const name =
						(params.event as { toolCallName?: string }).toolCallName ??
						(params.event as { name?: string }).name ??
						"";
					toolCalls.set(id, { id, name });
				},
				onToolCallArgsEvent: (params) => {
					const tc = toolCalls.get(params.event.toolCallId);
					if (tc) tc.args = (tc.args ?? "") + (params.event.delta ?? "");
				},
				onToolCallEndEvent: () => {},
				onToolCallResultEvent: (params) => {
					const tc = toolCalls.get(params.event.toolCallId);
					if (tc) tc.result = params.event.content;
				},
				onStepStartedEvent: () => {},
				onStepFinishedEvent: () => {},
			};

			const abortController = new AbortController();
			if (request.abortSignal) {
				request.abortSignal.addEventListener("abort", () =>
					abortController.abort(),
				);
			}

			const buildData = (): Record<string, unknown> | undefined => {
				if (toolCalls.size === 0) return undefined;
				return { toolCalls: [...toolCalls.values()] };
			};

			// Run agent in background, push events via subscriber
			const runPromise = agent
				.runAgent({ abortController }, subscriber)
				.then((result) => {
					// If streaming didn't deliver text, use newMessages as fallback
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
					if (err.name !== "AbortError") {
						push({ type: "error", message: err.message });
					}
				})
				.finally(() => {
					if (streamedText) {
						push({
							type: "text-done",
							content: streamedText,
							data: buildData(),
						});
					}
					finished = true;
					push(null);
				});

			// Yield events as they arrive
			while (true) {
				if (queue.length > 0) {
					const item = queue.shift()!;
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
