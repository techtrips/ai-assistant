import type { IAIAssistantService } from "./AIAssistant.services";
import type { IChatAdapter } from "./adapters/types";
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
	/** Show agent activity (developer mode). User-level setting. */
	showAgentActivity: boolean;
	/** Agents visible to all users. Empty = all agents. Global setting. */
	visibleAgents: string[];
}

/** Default enabled state for each built-in renderer type. */
export const DEFAULT_ENABLED_RENDERERS: Record<string, boolean> = {
	[MessageRendererType.Template]: true,
	[MessageRendererType.AdaptiveCard]: true,
	[MessageRendererType.DynamicUi]: false,
};

export const DEFAULT_SETTINGS: IAIAssistantSettings = {
	enabledRenderers: { ...DEFAULT_ENABLED_RENDERERS },
	showAgentActivity: false,
	visibleAgents: [],
};

export interface IChatMessageData {
	/** Serialized data string for rendering (from tool results or agent response). */
	payload?: string;
	/** Template identifier for DB-based rendering. */
	templateId?: string;
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
	extensions?: AIAssistantExtension[];
	service?: IAIAssistantService;
	permissions?: AIAssistantPermission[];
	context?: IAIAssistantContext;
	/** Message renderer pipeline. Pass only the renderers you want. If omitted, all defaults apply (filtered by settings). Custom-type renderers always run first. */
	messageRenderers?: IMessageRenderer[];
	onClose?: () => void;
}
