import type { IAIAssistantService } from "./AIAssistant.services";
import type { ChatErrorCodeLike, IChatAdapter } from "./adapters/types";
import type { AIAssistantExtension } from "./extensions/types";
import type { IMessageRenderer } from "./messageRenderers";
import { MessageRendererType } from "./messageRenderers";

/* ── Data models ── */

export interface IStarterPrompt {
	id?: string;
	agentName?: string;
	title: string;
	description?: string;
	prompt?: string;
	parameters?: string[] | null;
	tags?: string[] | null;
	templates?: string[] | null;
	order?: number;
}

export interface ITemplate {
	id?: string;
	name: string;
	description?: string;
	content?: string;
	data?: string;
	agent: string;
	createdAt?: string;
	updatedAt?: string;
	isStoredInDB?: boolean;
}

export interface IConversation {
	id: string;
	userOid: string;
	threadId: string;
	userEmail: string;
	firstMessageText: string;
	createdAt: string;
	lastActivityAt: string;
	agentName: string;
}

/* ── Permission & chat types ── */

export enum AIAssistantPermission {
	View = "view",
	ManageTemplates = "manage_templates",
	ManageStarterPrompts = "manage_starter_prompts",
	ManageSettings = "manage_settings",
}

/* ── Settings ── */

export interface IAIAssistantSettings {
	/**
	 * Which built-in renderers are enabled/disabled.
	 * Keyed by `MessageRendererType` string values (e.g. "template", "adaptiveCard", "dynamicUi").
	 * Custom renderers are always enabled and cannot be disabled via settings.
	 * Missing keys default to `true` except `dynamicUi` which defaults to `false`.
	 */
	enabledRenderers: Record<string, boolean>;
	/**
	 * Order in which built-in renderers run. Keys are `MessageRendererType`
	 * string values. Renderers not present in this list keep their relative
	 * order at the end of the chain. Empty/undefined = use the chain order
	 * provided by the host (or the package default).
	 * Global setting (admin-controlled).
	 */
	rendererOrder?: string[];
	/**
	 * Which extensions (sidebar/header buttons) are enabled. Keyed by extension
	 * `key` (e.g. "chats", "prompts", "settings"). Missing keys default to
	 * `true`. The `settings` extension itself is always shown when the user
	 * has `ManageSettings` permission so admins can recover.
	 * Global setting (admin-controlled).
	 */
	enabledExtensions?: Record<string, boolean>;
	/** Show agent activity (developer mode). User-level setting. */
	showAgentActivity: boolean;
	/**
	 * When true, renderers and adapters log internal errors to `console.error`.
	 * Off by default to keep consumer production consoles clean. User-level setting.
	 */
	debug?: boolean;
}

/** Default enabled state for each built-in renderer type. */
export const DEFAULT_ENABLED_RENDERERS: Record<string, boolean> = {
	[MessageRendererType.Template]: true,
	[MessageRendererType.AdaptiveCard]: true,
	[MessageRendererType.DynamicUi]: false,
	[MessageRendererType.Markdown]: true,
};

export const DEFAULT_SETTINGS: IAIAssistantSettings = {
	enabledRenderers: { ...DEFAULT_ENABLED_RENDERERS },
	showAgentActivity: true,
};

export interface IChatMessageData {
	/** Serialized data string for rendering (from tool results or agent response). */
	payload?: string;
	/** Template identifier for DB-based rendering. */
	templateId?: string;
	/**
	 * Names of tools the agent invoked while producing this message, in call
	 * order. Surfaced as a small footer on the assistant bubble so the user
	 * can see what the agent did. Empty / undefined for plain LLM responses.
	 */
	toolsUsed?: string[];
	/**
	 * Ordered list of activity status events (tool calls, reasoning, custom
	 * events, etc.) emitted by the agent while producing this message.
	 * Persisted so the user can expand a collapsible "Activity" section on
	 * the assistant bubble after streaming ends. Most recent entry last.
	 */
	activities?: IActivityEvent[];
}

export interface IActivityEvent {
	/** Stable identifier for the entry (e.g. `tool:<id>`, `activity:<msgId>`). */
	key: string;
	/** Human-readable label (e.g. "Calling SearchContent…"). */
	label: string;
	/** ISO timestamp of when the entry was recorded. */
	timestamp: string;
	/**
	 * Optional structured payload to surface inline when the user expands
	 * the row — e.g. tool-call args or a truncated result preview. Plain
	 * strings render as preformatted text; objects are JSON-stringified.
	 */
	detail?: string;
}

export interface IChatMessage {
	id: string;
	role: "user" | "assistant" | "error";
	/** Agent's text response. Optional — tool-only messages may not have text. */
	content?: string;
	timestamp: string;
	data?: IChatMessageData;
}

export interface IAIAssistantContext {
	page?: string;
	url?: string;
	tags?: string[];
	[key: string]: unknown;
}

export interface IAIAssistantProps {
	chatAdapter: IChatAdapter;
	theme?: "light" | "dark";
	greetingText?: string;
	headerText?: string;
	defaultFullScreen?: boolean;
	showFullScreenToggle?: boolean;
	className?: string;
	style?: React.CSSProperties;
	extensions?: AIAssistantExtension[];
	service?: IAIAssistantService;
	permissions?: AIAssistantPermission[];
	context?: IAIAssistantContext;
	/**
	 * Agent name this assistant instance is bound to. When set, the assistant
	 * uses this directly for starter prompts / templates / settings scoping
	 * and skips the `service.getAgentNames()` discovery call. If omitted, the
	 * service is queried for its agents.
	 */
	agentName?: string;
	/** Message renderer pipeline. Pass only the renderers you want. If omitted, all defaults apply (filtered by settings). Custom-type renderers always run first. */
	messageRenderers?: IMessageRenderer[];
	/**
	 * Invoked whenever an adapter yields an `error` event. Receives the full
	 * event so structured `code`/`data` fields can drive consumer UI (e.g. a
	 * token re-entry dialog on `code === ChatErrorCode.AuthRequired`).
	 */
	onError?: (event: {
		type: "error";
		message: string;
		code?: ChatErrorCodeLike;
		data?: Record<string, unknown>;
	}) => void;
	onClose?: () => void;
}
