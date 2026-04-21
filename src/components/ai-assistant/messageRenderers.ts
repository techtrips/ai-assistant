import type { IAIAssistantService } from "./AIAssistant.services";
import type { IAIAssistantSettings, IChatMessage } from "./AIAssistant.types";
import type { IAdaptiveCardAdapter } from "./AdaptiveCardRenderer";
import { renderAdaptiveCard } from "./AdaptiveCardRenderer";

// ---------------------------------------------------------------------------
// Message renderer — pluggable pipeline for rendering assistant messages
// ---------------------------------------------------------------------------

/** Identifies built-in renderer types. Use `Custom` for consumer-provided renderers. */
export enum MessageRendererType {
	/** Render via template from DB (fetched by templateId). */
	Template = "template",
	/** Render via Adaptive Card SDK — deterministic, zero LLM cost. */
	AdaptiveCard = "adaptiveCard",
	/** Render via LLM-generated HTML (Dynamic UI). */
	DynamicUi = "dynamicUi",
	/** Consumer-provided custom renderer (e.g. React component rendering). */
	Custom = "custom",
}

/** Result of a renderer — HTML string, React node, or undefined to skip. */
export type RenderResult = string | React.ReactNode | undefined;

/** Context passed to each renderer in the chain. */
export interface IRenderContext {
	message: IChatMessage;
	service?: IAIAssistantService;
	theme: "light" | "dark";
	settings: IAIAssistantSettings;
	model?: string;
}

/**
 * A single step in the message-rendering pipeline.
 *
 * `render()` returns an HTML string or React node if it handled the message,
 * or `undefined` to pass to the next renderer in the array.
 *
 * Custom renderers (`MessageRendererType.Custom`) always run before
 * built-in renderers regardless of array order.
 */
export interface IMessageRenderer {
	/** Renderer type — use enum values for built-in, `Custom` for consumer renderers. */
	type: MessageRendererType;
	/** Attempt to render the message. Return `undefined` to skip. */
	render(ctx: IRenderContext): Promise<RenderResult>;
}

// ---------------------------------------------------------------------------
// Helpers used by built-in renderers
// ---------------------------------------------------------------------------

const buildSystemPrompt = (theme: "light" | "dark" = "light"): string => {
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
};

const normalizeGeneratedHtml = (raw: string): string => {
	let html = raw.trim();
	html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");

	const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
	const styles = styleMatches ? styleMatches.join("\n") : "";

	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	if (bodyMatch?.[1]) html = bodyMatch[1].trim();

	return (styles ? `${styles}\n` : "") + html;
};

// ---------------------------------------------------------------------------
// Built-in renderers
// ---------------------------------------------------------------------------

/**
 * Template renderer — fetched by templateId from the DB.
 */
export const templateRenderer: IMessageRenderer = {
	type: MessageRendererType.Template,
	async render(ctx) {
		const templateId = ctx.message.data?.templateId;
		if (!templateId || !ctx.service) return undefined;
		try {
			const entity = await ctx.service.getTemplateById(templateId);
			return entity.data?.content ?? undefined;
		} catch (err) {
			console.error("[ai-assistant] Template lookup failed:", templateId, err);
			return undefined;
		}
	},
};

/**
 * Adaptive Card renderer — deterministic, zero LLM cost.
 * Accepts an optional `IAdaptiveCardAdapter` for layout/host config overrides.
 */
export const createAdaptiveCardRenderer = (
	adapter?: IAdaptiveCardAdapter,
): IMessageRenderer => ({
	type: MessageRendererType.AdaptiveCard,
	async render(ctx) {
		const payload = ctx.message.data?.payload;
		if (!payload) return undefined;
		return renderAdaptiveCard(payload, ctx.theme, adapter) ?? undefined;
	},
});

/** Default adaptive-card renderer using the built-in adapter. */
export const adaptiveCardRenderer: IMessageRenderer =
	createAdaptiveCardRenderer();

/**
 * Dynamic UI renderer — generates HTML via LLM.
 */
export const dynamicUiRenderer: IMessageRenderer = {
	type: MessageRendererType.DynamicUi,
	async render(ctx) {
		const dataStr = ctx.message.data?.payload;
		if (!dataStr || !ctx.service) return undefined;
		const prompt = buildSystemPrompt(ctx.theme);
		try {
			const raw = await ctx.service.generateDynamicUi(
				dataStr,
				prompt,
				ctx.model,
			);
			if (raw) {
				const normalized = normalizeGeneratedHtml(raw);
				if (normalized) return normalized;
			}
		} catch (err) {
			console.error("[ai-assistant] Dynamic UI generation failed:", err);
		}
		return undefined;
	},
};

// ---------------------------------------------------------------------------
// Default pipeline
// ---------------------------------------------------------------------------

/** The default renderer chain: template → adaptive card → dynamic UI. */
export const defaultMessageRenderers: IMessageRenderer[] = [
	templateRenderer,
	adaptiveCardRenderer,
	dynamicUiRenderer,
];
