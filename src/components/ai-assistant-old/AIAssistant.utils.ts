import type {
	IAIAssistantConversation,
	IAIAssistantMessage,
	ITemplateInfo,
} from "./AIAssistant.models";
import type { Message } from "@ag-ui/core";
import type { IToolCallRecord } from "./ag-ui/agui.subscriber";

export { type ITemplateInfo as ITemplateEntry } from "./AIAssistant.models";
export {
	CANCELLED_MESSAGE,
	DEFAULT_DEPLOYMENT,
	DEFAULT_API_VERSION,
} from "./AIAssistant.models";

/* ── Primitives ── */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const unwrapResults = (value: unknown): unknown =>
	isRecord(value) && Array.isArray(value.results) ? value.results : value;

export const parseStructuredPayload = (raw?: string): unknown | undefined => {
	if (!raw) return undefined;
	try {
		let parsed: unknown = raw;
		if (typeof parsed === "string") {
			parsed = JSON.parse(parsed);
			if (typeof parsed === "string") parsed = JSON.parse(parsed);
		}
		return parsed;
	} catch {
		return undefined;
	}
};

/* ── Shared iteration helper ──
 * Unwraps `{ results: [...] }`, then maps over every record item.
 * Works for both array and single-object payloads.
 */
const collectFromItems = <T>(
	value: unknown,
	fn: (item: Record<string, unknown>) => T | null,
): T[] => {
	const normalized = unwrapResults(value);

	if (Array.isArray(normalized)) {
		return normalized
			.filter((item): item is Record<string, unknown> => isRecord(item))
			.map(fn)
			.filter((r): r is T => r !== null);
	}

	if (isRecord(normalized)) {
		const result = fn(normalized);
		return result !== null ? [result] : [];
	}

	return [];
};

const getTemplateId = (item: Record<string, unknown>): string | undefined => {
	const raw = item.templateId ?? item.TemplateId ?? item.template_id;
	return raw != null ? String(raw) : undefined;
};

/* ── Template extraction ── */

export const extractTemplateEntries = (value: unknown): ITemplateInfo[] =>
	collectFromItems(value, (item) => {
		const templateId = getTemplateId(item);
		if (!templateId) return null;
		const isStoredInDb =
			item.isStoredInDb ?? item.isStoredInDB ?? item.IsStoredInDB;
		return {
			templateId,
			data: isRecord(item.data) ? item.data : item,
			...(typeof isStoredInDb === "boolean" ? { isStoredInDb } : {}),
		};
	});

const extractTemplateText = (value: unknown): string | undefined => {
	const parts = collectFromItems(value, (item) => {
		if (getTemplateId(item) !== "template_text") return null;

		if (typeof item.data === "string") return item.data;
		if (isRecord(item.data) && typeof item.data.text === "string")
			return item.data.text;
		if (typeof item.text === "string") return item.text;

		return null;
	}).filter((t) => t.trim().length > 0);

	return parts.length > 0 ? parts.join("\n") : undefined;
};

export const extractCustomPrompt = (value: unknown): string | undefined =>
	collectFromItems(value, (item) => {
		const raw = item.customPrompt ?? item.CustomPrompt;
		return raw != null ? String(raw) : null;
	})[0];

/* ── Display text ── */

export const extractDisplayText = (
	message: IAIAssistantMessage,
	payload: unknown,
): string => {
	const templateText = extractTemplateText(payload);
	if (templateText) return templateText;

	if (message.messageText.trim().length > 0) return message.messageText;
	if (message.serializedMessage?.trim()) return message.serializedMessage;

	if (payload != null) {
		try {
			return JSON.stringify(unwrapResults(payload), null, 2);
		} catch {
			return "";
		}
	}

	return "";
};

/* ── Payload sanitisation ── */

const removeNextActions = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(removeNextActions);
	if (!isRecord(value)) return value;

	const sanitized: Record<string, unknown> = {};
	for (const [key, v] of Object.entries(value)) {
		if (key.toLowerCase() !== "nextactions")
			sanitized[key] = removeNextActions(v);
	}
	return sanitized;
};

const toRenderablePayload = (value: unknown): unknown =>
	unwrapResults(removeNextActions(value));

/* ── Prompt builders ── */

export const buildSystemPrompt = (): string =>
	`You are a UI generator. You receive data from an AI agent and produce a single, concise HTML page.

DESIGN PHILOSOPHY: Show ONLY what matters. Be brief. No fluff. No raw JSON. No redundant sections.

Rules:
1. Output a FULL HTML document (<!DOCTYPE html> through </html>).
2. ALL CSS inlined in <style>. No external resources. While generating CSS, follow these principles:
    - Do not use global selectors such as html, body, :root, or *.
    - Scope every CSS rule to one unique wrapper class generated per response (for example: ai-block-[Date.now()]-[random]).
    - Prefix all element classes with the same unique token and keep selectors nested under the wrapper.
    - Ensure no style can affect the host page or components outside the generated content.
3. Light theme: white background, #333 text, accent #0078d4. Font: Segoe UI, system-ui.
4. Show data in ONE clean section only — pick the best format:
   - Few records → compact cards (2-3 key fields each, single row grid)
   - Many records → a tight table (only the most important 4-5 columns)
   - Single value → one large metric card
5. Include a short 1-line title. NO subtitle, NO user request echo, NO agent text dump.
6. Do NOT show raw JSON, tool call details, continuation tokens, or metadata.
7. Do NOT repeat the same data in multiple formats.
8. Do NOT include "Summary from agent" sections.
9. Keep total height minimal — aim for fitting in a single viewport.
10. Use status badges (colored pills) for status fields.
11. Output ONLY raw HTML — no markdown fences.
12. Do NOT include starter prompts, follow-up suggestion chips, action buttons, or input controls.
13. Follow-up prompts are rendered by the host app separately; never duplicate them inside result content.
14. Generate responsive, mobile-friendly HTML that adapts across screen sizes and avoids horizontal and vertical scrollbars whenever possible.`;

export const buildUserPrompt = (
	userMessageText: string | undefined,
	payload: unknown,
	customPrompt?: string,
): string => {
	const parts: string[] = [];
	const renderable = toRenderablePayload(payload);

	if (userMessageText?.trim()) {
		parts.push(`User asked: "${userMessageText}"`);
	}

	parts.push(
		Array.isArray(renderable)
			? `Records (${renderable.length} total):\n${JSON.stringify(renderable, null, 2)}`
			: `Data:\n${JSON.stringify(renderable, null, 2)}`,
	);

	if (customPrompt) {
		parts.push(`\nBackend rendering instructions:\n${customPrompt}`);
	}

	parts.push(
		"\nRender a concise, clean UI for this data. Show only key fields. No raw JSON.",
	);

	return parts.join("\n");
};

/* ── HTML normalisation ── */

export const normalizeGeneratedHtml = (raw: string): string => {
	let html = raw.trim();

	// Strip markdown fences if the model wrapped the output
	html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");

	const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
	const styles = styleMatches ? styleMatches.join("\n") : "";

	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	if (bodyMatch?.[1]) html = bodyMatch[1].trim();

	return (styles ? styles + "\n" : "") + html;
};

/* ── Message parsing ── */

export interface IParsedMessage {
	preGeneratedHtml: string | undefined;
	payload: unknown;
}

export const parseSerializedMessage = (
	message: IAIAssistantMessage,
): IParsedMessage => {
	let preGeneratedHtml: string | undefined;
	let payload: unknown;

	if (message.serializedMessage) {
		try {
			const parsed = JSON.parse(message.serializedMessage);
			if (parsed && typeof parsed === "object") {
				if (typeof parsed.__generatedHtml === "string")
					preGeneratedHtml = parsed.__generatedHtml;
				if (parsed.__payload) payload = parsed.__payload;
			}
		} catch {
			// Not the special wrapper format
		}

		payload ??=
			parseStructuredPayload(message.serializedMessage) ??
			parseStructuredPayload(message.messageText);
	} else {
		payload = parseStructuredPayload(message.messageText);
	}

	return { preGeneratedHtml, payload };
};

// ── Type guards ──────────────────────────────────────────────────────────────

export const isConversation = (
	value: unknown,
): value is IAIAssistantConversation =>
	typeof value === "object" &&
	value !== null &&
	"id" in value &&
	"threadId" in value;

// ── ID / key generation ──────────────────────────────────────────────────────

export const createThreadId = (): string =>
	`thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const buildCacheKey = (
	templateInfo: ITemplateInfo | undefined,
	payload: unknown,
	customPrompt: string | undefined,
): string => JSON.stringify({ templateInfo, payload, customPrompt });

// ── Error handling ───────────────────────────────────────────────────────────

export const getErrorMessage = (
	error: unknown,
	fallbackMessage: string,
): string =>
	error instanceof Error && error.message.trim()
		? error.message
		: fallbackMessage;

// ── Serialization / parsing ──────────────────────────────────────────────────

export const serializePayload = (payload: unknown): string | undefined => {
	if (payload == null) return undefined;
	try {
		return JSON.stringify(payload);
	} catch {
		return undefined;
	}
};

export const parseMessageContent = (message: Message): unknown | undefined => {
	const content = (message as { content?: unknown }).content;
	if (content == null) return undefined;
	if (typeof content !== "string") return content;

	try {
		let parsed: unknown = JSON.parse(content);
		if (typeof parsed === "string") parsed = JSON.parse(parsed);
		return parsed;
	} catch {
		return undefined;
	}
};

// ── Model builders ───────────────────────────────────────────────────────────

export const createConversation = (
	messageText: string,
	agentName: string,
	timestamp: string,
	threadId: string,
): IAIAssistantConversation => ({
	id: `${threadId}_${agentName}`,
	userOid: "local-user",
	threadId,
	userEmail: "",
	firstMessageText: messageText,
	createdAt: timestamp,
	lastActivityAt: timestamp,
	agentName,
});

export const createAssistantMessage = (
	messageText: string,
	partitionKey: string,
	payload?: unknown,
): IAIAssistantMessage => ({
	id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
	messageText,
	serializedMessage: serializePayload(payload),
	role: "assistant",
	timestamp: new Date().toISOString(),
	partitionKey,
});

// ── Payload processing ───────────────────────────────────────────────────────

const flattenPayloads = (payloads: unknown[]): { results: unknown[] } => {
	const results = payloads.flatMap((payload) => {
		if (Array.isArray(payload)) return payload;
		if (
			typeof payload === "object" &&
			payload !== null &&
			"results" in payload &&
			Array.isArray((payload as { results?: unknown[] }).results)
		) {
			return (payload as { results: unknown[] }).results;
		}
		return [payload];
	});
	return { results };
};

export const buildPayloadFromToolCalls = (
	toolCalls: IToolCallRecord[],
): unknown | undefined => {
	if (toolCalls.length === 0) return undefined;

	const parsed = toolCalls
		.map((tc) => {
			if (!tc.result) return undefined;
			try {
				let result: unknown = JSON.parse(tc.result);
				if (typeof result === "string") result = JSON.parse(result);
				return result;
			} catch {
				return undefined;
			}
		})
		.filter((p) => p !== undefined);

	if (parsed.length === 0) return undefined;
	if (parsed.length === 1) return parsed[0];
	return flattenPayloads(parsed);
};

export const buildRawToolPayload = (
	toolCalls: IToolCallRecord[],
	assistantText?: string,
): unknown => {
	const toolResults = toolCalls
		.filter((tc) => tc.result)
		.map((tc) => ({ toolName: tc.name, data: tc.result }));

	return {
		toolResults,
		...(assistantText ? { agentSummary: assistantText } : {}),
	};
};

export const extractRenderablePayload = (messages: Message[]): unknown => {
	const toolPayloads = messages
		.filter((message) => message.role === "tool")
		.map((message) => parseMessageContent(message))
		.filter((payload) => payload !== undefined);

	if (toolPayloads.length === 1) return toolPayloads[0];
	if (toolPayloads.length > 1) return flattenPayloads(toolPayloads);

	return (
		messages
			.filter((message) => message.role === "assistant")
			.map((message) => parseMessageContent(message))
			.find((payload) => payload !== undefined) ?? undefined
	);
};

export const hasRegisteredTemplate = (payload: unknown): boolean => {
	const checkTemplateId = (obj: Record<string, unknown>): boolean => {
		const rawId = obj.templateId ?? obj.TemplateId ?? obj.template_id;
		return rawId != null;
	};

	const normalized = unwrapResults(payload);

	if (Array.isArray(normalized)) {
		return normalized.some(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				checkTemplateId(item as Record<string, unknown>),
		);
	}

	if (typeof normalized === "object" && normalized !== null) {
		return checkTemplateId(normalized as Record<string, unknown>);
	}

	return false;
};

export const shouldRenderHelloWorldTemplate = (messageText: string): boolean =>
	messageText.toLowerCase().includes("hello world");
