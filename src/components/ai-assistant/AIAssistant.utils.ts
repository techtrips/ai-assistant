import type { IAIAssistantService } from "./AIAssistant.services";
import type { AIAssistantPermission, IChatMessage } from "./AIAssistant.types";

export const checkPermission = (
	permissions: AIAssistantPermission[] | undefined,
	permission: AIAssistantPermission,
): boolean => permissions?.includes(permission) ?? false;

export const buildSystemPrompt = (theme: "light" | "dark" = "light"): string => {
	const colors =
		theme === "dark"
			? { bg: "#1e1e1e", text: "#e0e0e0", accent: "#4ea8f0", muted: "#a0a0a0", surface: "#2d2d2d", border: "#404040" }
			: { bg: "#ffffff", text: "#333333", accent: "#0078d4", muted: "#6b6b6b", surface: "#f5f5f5", border: "#e0e0e0" };

	return `You are a UI generator. You receive data from an AI agent and produce a single, concise HTML page.

DESIGN PHILOSOPHY: Show ONLY what matters. Be brief. No fluff. No raw JSON. No redundant sections.

Rules:
1. Output a FULL HTML document (<!DOCTYPE html> through </html>).
2. ALL CSS inlined in <style>. No external resources. While generating CSS, follow these principles:
    - Do not use global selectors such as html, body, :root, or *.
    - Scope every CSS rule to one unique wrapper class generated per response (for example: ai-block-[Date.now()]-[random]).
    - Prefix all element classes with the same unique token and keep selectors nested under the wrapper.
    - Ensure no style can affect the host page or components outside the generated content.
3. Theme: background ${colors.bg}, text ${colors.text}, accent ${colors.accent}, muted text ${colors.muted}, surface/card ${colors.surface}, borders ${colors.border}. Font: Segoe UI, system-ui.
4. Show data in ONE clean section only \u2014 pick the best format:
   - Few records \u2192 compact cards (2-3 key fields each, single row grid)
   - Many records \u2192 a tight table (only the most important 4-5 columns)
   - Single value \u2192 one large metric card
5. Include a short 1-line title. NO subtitle, NO user request echo, NO agent text dump.
6. Do NOT show raw JSON, tool call details, continuation tokens, or metadata.
7. Do NOT repeat the same data in multiple formats.
8. Do NOT include "Summary from agent" sections.
9. Keep total height minimal \u2014 aim for fitting in a single viewport.
10. Use status badges (colored pills) for status fields.
11. Output ONLY raw HTML \u2014 no markdown fences.
12. Do NOT include starter prompts, follow-up suggestion chips, action buttons, or input controls.
13. Follow-up prompts are rendered by the host app separately; never duplicate them inside result content.
14. Generate responsive, mobile-friendly HTML that adapts across screen sizes and avoids horizontal and vertical scrollbars whenever possible.`;
};

export const normalizeGeneratedHtml = (raw: string): string => {
	let html = raw.trim();
	html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");

	const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
	const styles = styleMatches ? styleMatches.join("\n") : "";

	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	if (bodyMatch?.[1]) html = bodyMatch[1].trim();

	return (styles ? `${styles}\n` : "") + html;
};

/**
 * Returns true when the message should go through the rendering pipeline.
 * Only assistant messages with tool call data or an explicit templateId qualify.
 * Plain text assistant responses render as text bubbles without resolution.
 */
export const needsResolution = (message: IChatMessage): boolean => {
	if (message.role !== "assistant") return false;
	const data = message.data;
	if (!data) return false;
	const toolCalls = data.toolCalls as Array<{ name?: string }> | undefined;
	const templateId =
		(data.templateId as string) ??
		(data.TemplateId as string) ??
		toolCalls?.[0]?.name;
	return !!templateId;
};

/**
 * In-flight / resolved cache keyed by message ID.
 * Guarantees exactly one HTTP request per message regardless of
 * how many times React calls resolveMessage (StrictMode, re-renders, etc.).
 */
const resolveCache = new Map<
	string,
	{ promise: Promise<string | undefined>; done: boolean; html?: string }
>();

/**
 * Returns the synchronously-available resolved HTML for a message,
 * or undefined if not yet resolved.
 */
export const getResolvedFromCache = (
	messageId: string,
): { html: string | undefined } | null => {
	const entry = resolveCache.get(messageId);
	if (entry?.done) return { html: entry.html };
	return null;
};

/**
 * Resolves a single assistant message through the rendering pipeline.
 *
 * Priority chain:
 * 1. Template from DB — fetched by templateId (tool name convention).
 * 2. generateDynamicUi — OpenAI-generated HTML.
 * 3. undefined — component falls back to raw text.
 *
 * Only called for messages that pass needsResolution (have tool data).
 * The consumer's renderMessage callback is handled separately in the component.
 *
 * Results are cached by message ID.
 */
export const resolveMessage = (
	message: IChatMessage,
	service: IAIAssistantService,
	model?: string,
	theme?: "light" | "dark",
): Promise<string | undefined> => {
	if (message.role !== "assistant") return Promise.resolve(undefined);

	const existing = resolveCache.get(message.id);
	if (existing) return existing.promise;

	const promise = resolveMessageImpl(message, service, model, theme);
	const entry = { promise, done: false, html: undefined as string | undefined };
	resolveCache.set(message.id, entry);
	promise
		.then((html) => {
			entry.done = true;
			entry.html = html;
		})
		.catch(() => {
			entry.done = true;
			entry.html = undefined;
		});
	return promise;
};

const resolveMessageImpl = async (
	message: IChatMessage,
	service: IAIAssistantService,
	model?: string,
	theme?: "light" | "dark",
): Promise<string | undefined> => {
	// Priority 1: Template from DB — fetch by templateId (convention: tool name = template name)
	const toolCalls = message.data?.toolCalls as
		| Array<{ name?: string }>
		| undefined;
	const templateId =
		(message.data?.templateId as string) ??
		(message.data?.TemplateId as string) ??
		toolCalls?.[0]?.name;
	if (templateId) {
		try {
			const entity = await service.getTemplateById(templateId);
			if (entity.data?.content) {
				return entity.data.content;
			}
		} catch {
			/* fall through */
		}
	}

	// Priority 2: Generate dynamic HTML via OpenAI
	const toolPayload = message.data
		? extractToolPayload(message.data)
		: undefined;
	const dataStr = toolPayload
		? JSON.stringify(toolPayload)
		: message.content?.trim() || undefined;

	if (dataStr) {
		const customPrompt = ""; //message.customPrompt as string | undefined;
		const prompt = [buildSystemPrompt(theme), customPrompt?.trim()]
			.filter(Boolean)
			.join("\n\n");
		try {
			const raw = await service.generateDynamicUi(dataStr, prompt, model);
			if (raw) return normalizeGeneratedHtml(raw) || undefined;
		} catch {
			/* fall through */
		}
	}

	// Priority 3: No resolution available
	return undefined;
};

const extractToolPayload = (
	data: Record<string, unknown>,
): unknown | undefined => {
	const toolCalls = data.toolCalls as Array<{ result?: string }> | undefined;
	if (!toolCalls?.length) return undefined;
	const results = toolCalls
		.filter((tc) => tc.result)
		.map((tc) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: guarded by filter above
				return JSON.parse(tc.result!);
			} catch {
				return tc.result;
			}
		});
	if (results.length === 0) return undefined;
	return results.length === 1 ? results[0] : results;
};
