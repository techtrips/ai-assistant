/**
 * Builds the AG-UI `AgentSubscriber` for the adapter. Extracted into its
 * own module so it can be unit-tested in isolation (just call the
 * returned subscriber's `on*` callbacks with synthetic events and assert
 * on the `push` calls and `toolCalls` mutations).
 */
import type { AgentSubscriber } from "@ag-ui/client";
import type {
	ActivityDeltaEvent,
	ActivitySnapshotEvent,
	CustomEvent as AGUICustomEvent,
	ReasoningMessageContentEvent,
	RunErrorEvent,
	StepFinishedEvent,
	StepStartedEvent,
	TextMessageContentEvent,
	ToolCallArgsEvent,
	ToolCallEndEvent,
	ToolCallResultEvent,
	ToolCallStartEvent,
} from "@ag-ui/core";
import type { ChatEvent, IToolCallInfo } from "./types";
import {
	coerceToLabel,
	extractActivityLabel,
	humanizePhrase,
	humanizeToolName,
	prettifyDetail,
	describeResultSize,
} from "./agUiAdapter.helpers";

/** Internal mutable state owned by `agUiAdapter.sendMessage`. */
export interface SubscriberContext {
	push: (event: ChatEvent) => void;
	captureDetails: boolean;
	toolCalls: Map<string, IToolCallInfo>;
	debug?: boolean;
	/** Mutated by `onTextMessageContent` so the outer scope can fall back
	 *  to `runAgent.result.newMessages` if the stream ends without text. */
	onTextDelta: (delta: string) => void;
	/** Called after the first error is observed; used to dedupe between
	 *  `onRunErrorEvent` and `onRunFailed`. */
	markErrorPushed: () => boolean;
	/** Called when the streamed text message ends. */
	markTextEnd: () => void;
}

/** Caps to keep memory bounded on very long streams. */
const MAX_TOOL_ARGS_CHARS = 32 * 1024;
const MAX_REASONING_BUFFER_CHARS = 16 * 1024;
/** Reasoning content can fire dozens of times per second; throttle pushes. */
const REASONING_PUSH_INTERVAL_MS = 250;

/**
 * AG-UI raw event types that already have a typed handler below. We
 * skip the "raw fallback" status push for these so we don't double-emit.
 */
const TYPED_HANDLER_RAW_TYPES = new Set<string>([
	"TEXT_MESSAGE_START",
	"TEXT_MESSAGE_CONTENT",
	"TEXT_MESSAGE_END",
	"TOOL_CALL_ARGS",
	"TOOL_CALL_RESULT",
	"TOOL_CALL_START",
	"TOOL_CALL_END",
	"TOOL_CALL_CHUNK",
	"STEP_STARTED",
	"STEP_FINISHED",
	"REASONING_MESSAGE_START",
	"REASONING_MESSAGE_CONTENT",
	"REASONING_MESSAGE_END",
	"ACTIVITY_SNAPSHOT",
	"ACTIVITY_DELTA",
	"CUSTOM",
	"RAW",
	"STATE_SNAPSHOT",
	"STATE_DELTA",
	"MESSAGES_SNAPSHOT",
	"RUN_STARTED",
	"RUN_FINISHED",
	"RUN_ERROR",
]);

/**
 * Recognized `name` values on `CustomEvent` that drive the inline
 * status chip. Other custom events are ignored.
 */
const CUSTOM_STATUS_NAMES = new Set(["status", "activity", "loop"]);

export const buildAguiSubscriber = (
	ctx: SubscriberContext,
): AgentSubscriber => {
	const { push, captureDetails, toolCalls } = ctx;
	let lastReasoningPushAt = 0;

	return {
		onEvent: (params) => {
			const ev = params.event as { type?: string };
			const rawType = ev.type;
			if (!rawType) return;
			if (TYPED_HANDLER_RAW_TYPES.has(rawType)) return;
			if (ctx.debug) {
				// eslint-disable-next-line no-console
				console.warn(`[agui] ${rawType}`, params.event);
			}
			const label = humanizePhrase(rawType);
			if (label) {
				push({
					type: "status",
					label: `${label}\u2026`,
					key: `raw:${rawType}`,
				});
			}
		},
		onRunStartedEvent: () => {
			push({ type: "status", label: "Working\u2026", key: "run" });
		},
		onTextMessageStartEvent: () => {
			push({
				type: "status",
				label: "Composing reply\u2026",
				key: "compose",
			});
		},
		onReasoningMessageContentEvent: (params: {
			event: ReasoningMessageContentEvent;
			reasoningMessageBuffer?: string;
		}) => {
			const now = Date.now();
			if (now - lastReasoningPushAt < REASONING_PUSH_INTERVAL_MS) return;
			const rawBuf = params.reasoningMessageBuffer ?? "";
			const buf =
				rawBuf.length > MAX_REASONING_BUFFER_CHARS
					? rawBuf.slice(-MAX_REASONING_BUFFER_CHARS)
					: rawBuf;
			const tail = buf.replace(/\s+/g, " ").trim().slice(-80);
			if (tail) {
				lastReasoningPushAt = now;
				push({
					type: "status",
					label: tail,
					key: "reasoning",
					...(captureDetails && buf.trim()
						? { detail: prettifyDetail(buf) }
						: {}),
				});
			}
		},
		onReasoningStartEvent: () => {
			push({ type: "status", label: "Thinking\u2026", key: "reasoning" });
		},
		onReasoningEndEvent: () => {
			push({
				type: "status",
				label: "",
				done: true,
				key: "reasoning",
			});
		},
		onActivitySnapshotEvent: (params: { event: ActivitySnapshotEvent }) => {
			const ev = params.event;
			const label = extractActivityLabel(ev.activityType, ev.content);
			if (!label) return;
			const detail =
				captureDetails && ev.content
					? prettifyDetail(JSON.stringify(ev.content))
					: "";
			push({
				type: "status",
				label,
				key: `activity:${ev.messageId ?? ""}`,
				...(detail ? { detail } : {}),
			});
		},
		onActivityDeltaEvent: (params: {
			event: ActivityDeltaEvent;
			activityMessage?: {
				id: string;
				activityType?: string;
				content?: Record<string, unknown>;
			};
		}) => {
			const am = params.activityMessage;
			if (!am) return;
			const label = extractActivityLabel(am.activityType, am.content);
			if (!label) return;
			const detail =
				captureDetails && am.content
					? prettifyDetail(JSON.stringify(am.content))
					: "";
			push({
				type: "status",
				label,
				key: `activity:${am.id}`,
				...(detail ? { detail } : {}),
			});
		},
		onCustomEvent: (params: { event: AGUICustomEvent }) => {
			const ev = params.event;
			if (!ev.name || !CUSTOM_STATUS_NAMES.has(ev.name)) return;
			const label = coerceToLabel(ev.value);
			if (!label) return;
			const rawDetail = !captureDetails
				? ""
				: typeof ev.value === "string"
					? ev.value
					: ev.value !== undefined
						? JSON.stringify(ev.value)
						: "";
			const detail = rawDetail ? prettifyDetail(rawDetail) : "";
			push({
				type: "status",
				label,
				key: `custom:${ev.name}`,
				...(detail && detail !== label ? { detail } : {}),
			});
		},
		onTextMessageContentEvent: (params: { event: TextMessageContentEvent }) => {
			const delta = params.event.delta ?? "";
			ctx.onTextDelta(delta);
			push({ type: "text-delta", content: delta });
		},
		onTextMessageEndEvent: () => {
			ctx.markTextEnd();
			push({
				type: "status",
				label: "",
				done: true,
				key: "compose",
			});
		},
		onRunErrorEvent: (params: { event: RunErrorEvent }) => {
			if (!ctx.markErrorPushed()) return;
			push({ type: "error", message: params.event.message });
		},
		onRunFailed: (params: { error: Error }) => {
			if (!ctx.markErrorPushed()) return;
			push({ type: "error", message: params.error.message });
		},
		onRunFinishedEvent: () => {
			push({ type: "status", label: "Done", key: "run-done" });
			push({ type: "status", label: "", done: true });
		},
		onToolCallStartEvent: (params: { event: ToolCallStartEvent }) => {
			const id = params.event.toolCallId;
			const name = params.event.toolCallName ?? "";
			toolCalls.set(id, { id, name });
			if (name) {
				const label = humanizeToolName(name) || `Calling ${name}`;
				push({
					type: "status",
					label: `${label}\u2026`,
					key: `tool:${id}`,
				});
			} else {
				push({
					type: "status",
					label: "Calling tool\u2026",
					key: `tool:${id}`,
				});
			}
		},
		onToolCallArgsEvent: (params: { event: ToolCallArgsEvent }) => {
			const tc = toolCalls.get(params.event.toolCallId);
			if (!tc) return;
			const current = tc.args ?? "";
			if (current.length >= MAX_TOOL_ARGS_CHARS) return;
			const delta = params.event.delta ?? "";
			const remaining = MAX_TOOL_ARGS_CHARS - current.length;
			tc.args =
				current +
				(delta.length > remaining ? delta.slice(0, remaining) : delta);
		},
		onToolCallEndEvent: (params: { event: ToolCallEndEvent }) => {
			const id = params.event.toolCallId;
			const tc = toolCalls.get(id);
			const name = tc?.name ?? "";
			const friendly = name ? humanizeToolName(name) || name : "tool";
			push({
				type: "status",
				label: `Finished ${friendly.toLowerCase()}`,
				key: `tool-done:${id}`,
				...(captureDetails && tc?.args
					? { detail: prettifyDetail(tc.args) }
					: {}),
			});
			push({
				type: "status",
				label: "",
				done: true,
				key: `tool:${id}`,
			});
		},
		onToolCallResultEvent: (params: { event: ToolCallResultEvent }) => {
			const tc = toolCalls.get(params.event.toolCallId);
			if (tc) tc.result = params.event.content;
			const raw = params.event.content ?? "";
			const hint = describeResultSize(raw);
			if (!hint) return;
			const id = params.event.toolCallId;
			const name = tc?.name ?? "";
			const friendly = name ? humanizeToolName(name) || name : "tool";
			push({
				type: "status",
				label: `Received ${hint} from ${friendly.toLowerCase()}`,
				key: `tool-result:${id}`,
				...(captureDetails ? { detail: prettifyDetail(raw) } : {}),
			});
		},
		onStepStartedEvent: (params: { event: StepStartedEvent }) => {
			const stepName = params.event.stepName ?? "";
			if (stepName) {
				const label = humanizeToolName(stepName) || stepName;
				push({
					type: "status",
					label: `${label}\u2026`,
					key: `step:${stepName}`,
				});
			}
		},
		onStepFinishedEvent: (params: { event: StepFinishedEvent }) => {
			const stepName = params.event.stepName ?? "";
			if (stepName) {
				const label = humanizeToolName(stepName) || stepName;
				push({
					type: "status",
					label: `Finished ${label.toLowerCase()}`,
					key: `step-done:${stepName}`,
				});
			}
			push({
				type: "status",
				label: "",
				done: true,
				key: stepName ? `step:${stepName}` : undefined,
			});
		},
	};
};
