import { useCallback, useRef, useState } from "react";
import type {
	ChatEvent,
	IChatAdapter,
	IChatHistoryEntry,
} from "./adapters/types";
import type { IChatMessage, IChatMessageData } from "./AIAssistant.types";

const nextId = () =>
	`msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const nextThreadId = () =>
	`thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Maximum number of prior turns (user + assistant) forwarded to the adapter
 * on each `sendMessage`. Caps the per-request payload so a long-running
 * thread doesn't grow the request linearly while still giving the agent
 * enough context for follow-up questions.
 */
const HISTORY_WINDOW = 20;

const buildHistory = (messages: IChatMessage[]): IChatHistoryEntry[] => {
	const entries: IChatHistoryEntry[] = [];
	for (const msg of messages) {
		if (msg.role !== "user" && msg.role !== "assistant") continue;
		if (typeof msg.content !== "string" || msg.content.length === 0) continue;
		entries.push({ role: msg.role, content: msg.content });
	}
	return entries.length > HISTORY_WINDOW
		? entries.slice(entries.length - HISTORY_WINDOW)
		: entries;
};

export interface IUseChatStateResult {
	messages: IChatMessage[];
	setMessages: (
		action: IChatMessage[] | ((prev: IChatMessage[]) => IChatMessage[]),
	) => void;
	threadId: string;
	setThreadId: (id: string) => void;
	isStreaming: boolean;
	streamingText: string;
	/**
	 * Current activity label emitted by the adapter (e.g. "Calling SearchContent…").
	 * Empty string when no activity is in progress. Auto-clears as soon as the
	 * model starts producing text, so it never coexists with `streamingText`.
	 */
	statusLabel: string;
	error: string | undefined;
	sendMessage: (text: string, model?: string) => void;
	abort: () => void;
	newChat: () => void;
}

export const useChatState = (
	adapter: IChatAdapter,
	onError?: (event: Extract<ChatEvent, { type: "error" }>) => void,
): IUseChatStateResult => {
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [threadId, setThreadId] = useState(() => nextThreadId());
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingText, setStreamingText] = useState("");
	const [statusLabel, setStatusLabel] = useState("");
	const [error, setError] = useState<string | undefined>();
	const abortRef = useRef<AbortController | null>(null);

	const abort = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	const sendMessage = useCallback(
		(text: string, model?: string) => {
			if (!text.trim() || isStreaming) return;

			const userMsg: IChatMessage = {
				id: nextId(),
				role: "user",
				content: text,
				timestamp: new Date().toISOString(),
			};

			// Snapshot history BEFORE we append the new user message so the
			// adapter sees only prior turns; the current message is sent
			// separately as `request.message`.
			let history: ReadonlyArray<IChatHistoryEntry> | undefined;
			setMessages((prev) => {
				history = buildHistory(prev);
				return [...prev, userMsg];
			});
			setIsStreaming(true);
			setStreamingText("");
			setStatusLabel("");
			setError(undefined);

			const ac = new AbortController();
			abortRef.current = ac;

			const messageId = nextId();

			(async () => {
				let fullText = "";
				let hadError = false;
				let messageData: IChatMessageData | undefined;

				try {
					const stream = adapter.sendMessage({
						threadId,
						messageId,
						message: text,
						model,
						abortSignal: ac.signal,
						history,
					});

					for await (const event of stream) {
						if (ac.signal.aborted) break;

						switch (event.type) {
							case "text-delta":
								fullText += event.content;
								setStreamingText(fullText);
								// Model is now writing — hide any "calling tool…" indicator.
								setStatusLabel("");
								break;
							case "text-done":
								fullText = event.content || fullText;
								if (event.data) messageData = event.data;
								setStreamingText(fullText);
								setStatusLabel("");
								break;
							case "status":
								setStatusLabel(event.done ? "" : event.label);
								break;
							case "error":
								hadError = true;
								setError(event.message);
								setMessages((prev) => [
									...prev,
									{
										id: nextId(),
										role: "error",
										content: event.message,
										timestamp: new Date().toISOString(),
									},
								]);
								onError?.(event);
								break;
						}
					}
				} catch (err: unknown) {
					if (err instanceof Error && err.name === "AbortError") {
						// User cancelled — do nothing
					} else {
						hadError = true;
						const msg = err instanceof Error ? err.message : "Unknown error";
						setError(msg);
						setMessages((prev) => [
							...prev,
							{
								id: nextId(),
								role: "error",
								content: msg,
								timestamp: new Date().toISOString(),
							},
						]);
					}
				}

				if (!hadError && (fullText || messageData)) {
					setMessages((prev) => [
						...prev,
						{
							id: messageId,
							role: "assistant",
							content: fullText || undefined,
							timestamp: new Date().toISOString(),
							data: messageData,
						},
					]);
				}

				setIsStreaming(false);
				setStreamingText("");
				setStatusLabel("");
				abortRef.current = null;
			})();
		},
		[adapter, threadId, isStreaming],
	);

	const newChat = useCallback(() => {
		abort();
		setMessages([]);
		setThreadId(nextThreadId());
		setStreamingText("");
		setStatusLabel("");
		setError(undefined);
		setIsStreaming(false);
	}, [abort]);

	return {
		messages,
		setMessages,
		threadId,
		setThreadId,
		isStreaming,
		streamingText,
		statusLabel,
		error,
		sendMessage,
		abort,
		newChat,
	};
};
