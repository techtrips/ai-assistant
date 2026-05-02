import { useCallback, useEffect, useRef, useState } from "react";
import type {
	ChatEvent,
	IChatAdapter,
	IChatHistoryEntry,
} from "./adapters/types";
import type {
	IChatMessage,
	IChatMessageData,
	IActivityEvent,
} from "./AIAssistant.types";

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

/**
 * Schedule a callback on the next animation frame, falling back to a
 * microtask in non-DOM environments (tests, SSR). We use this to coalesce
 * streaming-text and activity updates so a chatty agent doesn't trigger
 * a React render per token.
 */
const scheduleFlush = (cb: () => void): (() => void) => {
	if (typeof window !== "undefined" && window.requestAnimationFrame) {
		const id = window.requestAnimationFrame(cb);
		return () => window.cancelAnimationFrame(id);
	}
	const id = setTimeout(cb, 0);
	return () => clearTimeout(id);
};

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
	/**
	 * Live, in-order list of activity entries captured during the current
	 * stream. Cleared when the next message is sent or the stream finalizes.
	 * Persisted activities for completed messages live on `message.data.activities`.
	 */
	streamingActivities: IActivityEvent[];
	/**
	 * True while the current stream has invoked at least one tool / step.
	 * Used by the UI to decide whether to suppress the in-flight markdown
	 * bubble (since tool replies typically resolve to an Adaptive Card /
	 * template, swapping mid-stream looks jarring).
	 */
	hasToolActivity: boolean;
	error: string | undefined;
	sendMessage: (text: string, model?: string) => void;
	abort: () => void;
	newChat: () => void;
}

export const useChatState = (
	adapter: IChatAdapter,
	onError?: (event: Extract<ChatEvent, { type: "error" }>) => void,
	options?: {
		captureActivityDetails?: boolean;
		/**
		 * Maximum time (ms) the adapter is allowed to stay silent before the
		 * stream is auto-aborted with a timeout error. Resets on every event.
		 * Defaults to undefined (no timeout). Recommended: 60_000 for
		 * production deployments behind unreliable networks.
		 */
		requestTimeoutMs?: number;
	},
): IUseChatStateResult => {
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [threadId, setThreadId] = useState(() => nextThreadId());
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingText, setStreamingText] = useState("");
	const [statusLabel, setStatusLabel] = useState("");
	const [streamingActivities, setStreamingActivities] = useState<
		IActivityEvent[]
	>([]);
	const [hasToolActivity, setHasToolActivity] = useState(false);
	// Per-key stack of active status entries. The most recently pushed
	// entry wins. Each adapter event carries an optional `key` so its
	// matching `done:true` clears only that entry rather than wiping the
	// chip whenever any sub-activity ends.
	const statusStackRef = useRef<Array<{ key: string; label: string }>>([]);
	const [error, setError] = useState<string | undefined>();
	const abortRef = useRef<AbortController | null>(null);
	// Mirror the latest capture flag in a ref so `sendMessage` doesn't need
	// to re-create whenever the host setting toggles.
	const captureDetailsRef = useRef<boolean>(
		options?.captureActivityDetails !== false,
	);
	captureDetailsRef.current = options?.captureActivityDetails !== false;
	const timeoutMsRef = useRef<number | undefined>(options?.requestTimeoutMs);
	timeoutMsRef.current = options?.requestTimeoutMs;

	// Stabilize external dependencies so `sendMessage` remains referentially
	// stable across re-renders. Without this, every change to `adapter`,
	// `threadId`, `onError` (or any consumer-facing prop higher up) would
	// invalidate the callback and cascade into memoized children — costly
	// when the consumer wraps this in a heavily-used control.
	const adapterRef = useRef(adapter);
	adapterRef.current = adapter;
	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;
	const threadIdRef = useRef(threadId);
	threadIdRef.current = threadId;
	const isStreamingRef = useRef(isStreaming);
	isStreamingRef.current = isStreaming;

	// Pending coalesced state — flushed once per animation frame instead of
	// per event. Critical for chatty agents emitting many text deltas /
	// activity rows in quick succession.
	const pendingTextRef = useRef<string | null>(null);
	const pendingActivitiesRef = useRef<IActivityEvent[] | null>(null);
	const flushHandleRef = useRef<(() => void) | null>(null);
	const scheduleFlushIfNeeded = useCallback(() => {
		if (flushHandleRef.current) return;
		flushHandleRef.current = scheduleFlush(() => {
			flushHandleRef.current = null;
			if (pendingTextRef.current !== null) {
				const next = pendingTextRef.current;
				pendingTextRef.current = null;
				setStreamingText(next);
			}
			if (pendingActivitiesRef.current !== null) {
				const next = pendingActivitiesRef.current;
				pendingActivitiesRef.current = null;
				setStreamingActivities(next);
			}
		});
	}, []);
	useEffect(
		() => () => {
			if (flushHandleRef.current) {
				flushHandleRef.current();
				flushHandleRef.current = null;
			}
		},
		[],
	);

	const applyStatus = useCallback(
		(event: { label: string; key?: string; done?: boolean }) => {
			const key = event.key ?? "__default";
			const stack = statusStackRef.current;
			const existingIdx = stack.findIndex((e) => e.key === key);
			if (event.done) {
				if (existingIdx >= 0) stack.splice(existingIdx, 1);
			} else if (existingIdx >= 0) {
				// Refresh label and bump to top.
				stack.splice(existingIdx, 1);
				stack.push({ key, label: event.label });
			} else {
				stack.push({ key, label: event.label });
			}
			setStatusLabel(stack.length > 0 ? stack[stack.length - 1].label : "");
		},
		[],
	);

	const clearStatus = useCallback(() => {
		statusStackRef.current = [];
		setStatusLabel("");
	}, []);

	const abort = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		if (flushHandleRef.current) {
			flushHandleRef.current();
			flushHandleRef.current = null;
		}
		pendingTextRef.current = null;
		pendingActivitiesRef.current = null;
	}, []);

	const sendMessage = useCallback(
		(text: string, model?: string) => {
			if (!text.trim() || isStreamingRef.current) return;

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
			isStreamingRef.current = true;
			setIsStreaming(true);
			setStreamingText("");
			pendingTextRef.current = null;
			pendingActivitiesRef.current = null;
			clearStatus();
			setStreamingActivities([]);
			setHasToolActivity(false);
			setError(undefined);

			const ac = new AbortController();
			abortRef.current = ac;

			// Inactivity timeout. Resets on every event so a healthy stream
			// never trips it; only fires when the adapter goes silent for
			// `requestTimeoutMs` (e.g. dropped SSE connection).
			let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
			let timedOut = false;
			const armTimeout = () => {
				const ms = timeoutMsRef.current;
				if (!ms || ms <= 0) return;
				if (inactivityTimer) clearTimeout(inactivityTimer);
				inactivityTimer = setTimeout(() => {
					timedOut = true;
					ac.abort();
				}, ms);
			};
			const clearTimeoutTimer = () => {
				if (inactivityTimer) {
					clearTimeout(inactivityTimer);
					inactivityTimer = null;
				}
			};

			const messageId = nextId();
			// Snapshot the threadId at send-time so a concurrent newChat()
			// can't reroute an in-flight stream to a different thread.
			const sendThreadId = threadIdRef.current;

			(async () => {
				let fullText = "";
				let hadError = false;
				let messageData: IChatMessageData | undefined;
				const activities: IActivityEvent[] = [];
				let toolFlagSet = false;

				try {
					const stream = adapterRef.current.sendMessage({
						threadId: sendThreadId,
						messageId,
						message: text,
						model,
						abortSignal: ac.signal,
						history,
						captureActivityDetails: captureDetailsRef.current,
					});

					armTimeout();
					for await (const event of stream) {
						if (ac.signal.aborted) break;
						armTimeout();

						switch (event.type) {
							case "text-delta":
								fullText += event.content;
								pendingTextRef.current = fullText;
								scheduleFlushIfNeeded();
								break;
							case "text-done":
								fullText = event.content || fullText;
								if (event.data) messageData = event.data;
								pendingTextRef.current = fullText;
								scheduleFlushIfNeeded();
								break;
							case "status":
								applyStatus(event);
								if (!event.done && event.label) {
									const entry: IActivityEvent = {
										key: event.key ?? "__default",
										label: event.label,
										timestamp: new Date().toISOString(),
										...(event.detail ? { detail: event.detail } : {}),
									};
									activities.push(entry);
									pendingActivitiesRef.current = activities.slice();
									scheduleFlushIfNeeded();
									if (
										!toolFlagSet &&
										(entry.key.startsWith("tool:") ||
											entry.key.startsWith("tool-done:"))
									) {
										toolFlagSet = true;
										setHasToolActivity(true);
									}
								}
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
								onErrorRef.current?.(event);
								break;
						}
					}
				} catch (err: unknown) {
					if (err instanceof Error && err.name === "AbortError") {
						if (timedOut) {
							hadError = true;
							const msg = `Request timed out after ${timeoutMsRef.current}ms of inactivity`;
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
					const finalData: IChatMessageData | undefined =
						activities.length > 0
							? { ...(messageData ?? {}), activities }
							: messageData;
					setMessages((prev) => [
						...prev,
						{
							id: messageId,
							role: "assistant",
							content: fullText || undefined,
							timestamp: new Date().toISOString(),
							data: finalData,
						},
					]);
				}

				// Cancel any pending coalesced flush — the values are now
				// stale (we're about to wipe streaming state).
				if (flushHandleRef.current) {
					flushHandleRef.current();
					flushHandleRef.current = null;
				}
				clearTimeoutTimer();
				pendingTextRef.current = null;
				pendingActivitiesRef.current = null;
				isStreamingRef.current = false;
				setIsStreaming(false);
				setStreamingText("");
				clearStatus();
				setStreamingActivities([]);
				abortRef.current = null;
			})();
		},
		[applyStatus, clearStatus, scheduleFlushIfNeeded],
	);

	const newChat = useCallback(() => {
		abort();
		setMessages([]);
		setThreadId(nextThreadId());
		setStreamingText("");
		clearStatus();
		setStreamingActivities([]);
		setError(undefined);
		setIsStreaming(false);
	}, [abort, clearStatus]);

	return {
		messages,
		setMessages,
		threadId,
		setThreadId,
		isStreaming,
		streamingText,
		statusLabel,
		streamingActivities,
		hasToolActivity,
		error,
		sendMessage,
		abort,
		newChat,
	};
};
