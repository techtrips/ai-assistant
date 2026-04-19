/**
 * AG-UI Event Subscriber Factory
 *
 * Creates subscriber objects for handling AG-UI streaming events,
 * mirroring the pattern used in Commerce.AI.Agents.Client.
 */
import type {
	AgentSubscriber,
	TextMessageContentEvent,
	TextMessageEndEvent,
	ToolCallStartEvent,
	ToolCallArgsEvent,
	ToolCallEndEvent,
	ToolCallResultEvent,
	RunErrorEvent,
	StepStartedEvent,
	StepFinishedEvent,
} from "@ag-ui/client";

export interface IToolCallRecord {
	id: string;
	name: string;
	args?: string;
	result?: string;
	done: boolean;
}

export interface ITextAccumulator {
	text: string;
	toolCalls: Map<string, IToolCallRecord>;
	error?: string;
}

/**
 * Creates an AG-UI subscriber that streams text into an accumulator
 * and invokes `onUpdate` after every relevant event so the UI can
 * update incrementally.
 */
export const createAGUISubscriber = (
	acc: ITextAccumulator,
	onUpdate: () => void,
): AgentSubscriber => ({
	onTextMessageStartEvent: () => {
		acc.text = "";
	},

	onTextMessageContentEvent: (params: {
		textMessageBuffer: string;
		event: TextMessageContentEvent;
	}) => {
		acc.text = params.textMessageBuffer;
		onUpdate();
	},

	onTextMessageEndEvent: (params: {
		textMessageBuffer: string;
		event: TextMessageEndEvent;
	}) => {
		acc.text = params.textMessageBuffer || acc.text;
		onUpdate();
	},

	onStepStartedEvent: (params: { event: StepStartedEvent }) => {
		console.log("[AG-UI] Step started:", params.event.stepName);
	},

	onStepFinishedEvent: (params: { event: StepFinishedEvent }) => {
		console.log("[AG-UI] Step finished:", params.event.stepName);
	},

	onToolCallStartEvent: (params: { event: ToolCallStartEvent }) => {
		const toolCall: IToolCallRecord = {
			id: params.event.toolCallId,
			name:
				(params.event as { toolCallName?: string; name?: string })
					.toolCallName ??
				(params.event as { toolCallName?: string; name?: string }).name ??
				"unknown",
			args: "",
			done: false,
		};
		acc.toolCalls.set(toolCall.id, toolCall);
		console.log("[AG-UI] Tool call started:", toolCall.id, toolCall.name);
	},

	onToolCallArgsEvent: (params: { event: ToolCallArgsEvent }) => {
		const tc = acc.toolCalls.get(params.event.toolCallId);
		if (tc) {
			tc.args = (tc.args || "") + params.event.delta;
		}
	},

	onToolCallEndEvent: (params: { event: ToolCallEndEvent }) => {
		const tc = acc.toolCalls.get(params.event.toolCallId);
		if (tc) {
			tc.done = true;
			console.log("[AG-UI] Tool call ended:", tc.id, tc.name);
		}
	},

	onToolCallResultEvent: (params: { event: ToolCallResultEvent }) => {
		const tc = acc.toolCalls.get(params.event.toolCallId);
		if (tc) {
			tc.result =
				typeof params.event.content === "string"
					? params.event.content
					: JSON.stringify(params.event.content);
			console.log(
				"[AG-UI] Tool result received:",
				tc.name,
				tc.result?.substring(0, 200),
			);
			onUpdate();
		}
	},

	onRunErrorEvent: (params: { event: RunErrorEvent }) => {
		acc.error = params.event.message;
		onUpdate();
	},

	onRunFinishedEvent: () => {
		onUpdate();
	},

	onRunFailed: (params: { error: Error }) => {
		acc.error = params.error.message;
		onUpdate();
	},
});

/**
 * Process tool results from newMessages after run completes,
 * filling in any results not captured by streaming events.
 */
export const processToolResults = (
	newMessages: Array<{ role: string; toolCallId?: string; content: unknown }>,
	acc: ITextAccumulator,
): void => {
	for (const msg of newMessages) {
		if (msg.role === "tool" && msg.toolCallId) {
			const tc = acc.toolCalls.get(msg.toolCallId);
			if (tc && !tc.result) {
				tc.result =
					typeof msg.content === "string"
						? msg.content
						: JSON.stringify(msg.content);
			}
		}
	}
};
