import type { IAIAssistantService } from "./AIAssistant.services";
import type {
	AIAssistantPermission,
	IAIAssistantSettings,
	IChatMessage,
} from "./AIAssistant.types";

export const checkPermission = (
	permissions: AIAssistantPermission[] | undefined,
	permission: AIAssistantPermission,
): boolean => permissions?.includes(permission) ?? false;

export const buildSystemPrompt = (
	theme: "light" | "dark" = "light",
): string => {
	const colors =
		theme === "dark"
			? {
					bg: "#1e1e1e",
					text: "#e0e0e0",
					accent: "#4ea8f0",
					muted: "#a0a0a0",
					surface: "#2d2d2d",
					border: "#404040",
				}
			: {
					bg: "#ffffff",
					text: "#333333",
					accent: "#0078d4",
					muted: "#6b6b6b",
					surface: "#f5f5f5",
					border: "#e0e0e0",
				};

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
 * Checks for pre-computed payload or templateId — both set at source.
 */
export const needsResolution = (message: IChatMessage): boolean => {
	if (message.role !== "assistant") return false;
	const data = message.data;
	if (!data) return false;
	return !!(data.payload || data.templateId);
};

/**
 * In-flight / resolved cache keyed by message ID.
 * Guarantees exactly one HTTP request per message regardless of
 * how many times React calls resolveMessage (StrictMode, re-renders, etc.).
 * Limited to MAX_CACHE_SIZE entries to prevent memory leaks in long sessions.
 */
const MAX_CACHE_SIZE = 200;
const resolveCache = new Map<
	string,
	{ promise: Promise<string | undefined>; done: boolean; html?: string }
>();

const evictOldestEntries = () => {
	if (resolveCache.size <= MAX_CACHE_SIZE) return;
	const excess = resolveCache.size - MAX_CACHE_SIZE;
	const keys = resolveCache.keys();
	for (let i = 0; i < excess; i++) {
		const { value } = keys.next();
		if (value) resolveCache.delete(value);
	}
};

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
	settings?: IAIAssistantSettings,
): Promise<string | undefined> => {
	if (message.role !== "assistant") return Promise.resolve(undefined);

	const existing = resolveCache.get(message.id);
	if (existing) return existing.promise;

	const promise = resolveMessageImpl(message, service, model, theme, settings);
	const entry = { promise, done: false, html: undefined as string | undefined };
	resolveCache.set(message.id, entry);
	evictOldestEntries();
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
	settings?: IAIAssistantSettings,
): Promise<string | undefined> => {
	// Priority 1: Template from DB — fetch by templateId (convention: tool name = template name)
	if (settings?.enableTemplateResolution !== false) {
		const templateId = message.data?.templateId;
		if (templateId) {
			try {
				const entity = await service.getTemplateById(templateId);
				if (entity.data?.content) {
					return entity.data.content;
				}
			} catch (err) {
				console.error(
					"[ai-assistant] Template lookup failed:",
					templateId,
					err,
				);
			}
		}
	}

	// Priority 2: Generate dynamic HTML via OpenAI
	if (settings?.enableDynamicUi !== false) {
		const dataStr = message.data?.payload;

		if (dataStr) {
			const prompt = buildSystemPrompt(theme);
			try {
				const raw = await service.generateDynamicUi(dataStr, prompt, model);
				if (raw) {
					const normalized = normalizeGeneratedHtml(raw);
					if (normalized) return normalized;
				}
			} catch (err) {
				console.error("[ai-assistant] Dynamic UI generation failed:", err);
			}
		}
	}

	// Priority 3: No resolution — component shows content as text or payload as raw data
	return undefined;
};
