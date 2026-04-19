import { useCallback, useRef, useState } from "react";
import type { IChatAdapter } from "./adapters/types";
import type { IChatMessage } from "./AIAssistant.types";

let idCounter = 0;
const nextId = () => `msg-${++idCounter}-${Date.now()}`;
const nextThreadId = () =>
	`thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface IUseChatStateResult {
	messages: IChatMessage[];
	setMessages: (messages: IChatMessage[]) => void;
	threadId: string;
	setThreadId: (id: string) => void;
	isStreaming: boolean;
	streamingText: string;
	error: string | undefined;
	sendMessage: (text: string, model?: string) => void;
	abort: () => void;
	newChat: () => void;
}

export const useChatState = (adapter: IChatAdapter): IUseChatStateResult => {
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [threadId, setThreadId] = useState(() => nextThreadId());
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingText, setStreamingText] = useState("");
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

			setMessages((prev) => [...prev, userMsg]);
			setIsStreaming(true);
			setStreamingText("");
			setError(undefined);

			const ac = new AbortController();
			abortRef.current = ac;

			const messageId = nextId();

			(async () => {
				let fullText = "";
				let hadError = false;
				let messageData: Record<string, unknown> | undefined;

				try {
					const stream = adapter.sendMessage({
						threadId,
						messageId,
						message: text,
						model,
						abortSignal: ac.signal,
					});

					for await (const event of stream) {
						if (ac.signal.aborted) break;

						switch (event.type) {
							case "text-delta":
								fullText += event.content;
								setStreamingText(fullText);
								break;
							case "text-done":
								fullText = event.content || fullText;
								if (event.data) messageData = event.data;
								setStreamingText(fullText);
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

				if (!hadError && fullText) {
					setMessages((prev) => [
						...prev,
						{
							id: messageId,
							role: "assistant",
							content: fullText,
							timestamp: new Date().toISOString(),
							data: messageData,
						},
					]);
				}

				setIsStreaming(false);
				setStreamingText("");
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
		error,
		sendMessage,
		abort,
		newChat,
	};
};
