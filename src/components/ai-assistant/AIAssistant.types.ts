import type { ReactNode } from "react";
import type { IChatAdapter } from "./adapters/types";
import type { AIAssistantExtension } from "./extensions/types";
import type { IAIAssistantService } from "./AIAssistant.services";

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
	/** Disable template resolution (saves LLM cost). Applies globally when set by admin. */
	enableTemplateResolution: boolean;
	/** Disable dynamic UI generation via LLM. Applies globally when set by admin. */
	enableDynamicUi: boolean;
	/** Show agent activity (developer mode). User-level setting. */
	showAgentActivity: boolean;
	/** Agents visible to all users. Empty = all agents. Global setting. */
	visibleAgents: string[];
}

export const DEFAULT_SETTINGS: IAIAssistantSettings = {
	enableTemplateResolution: true,
	enableDynamicUi: true,
	showAgentActivity: false,
	visibleAgents: [],
};

export interface IChatMessage {
	id: string;
	role: "user" | "assistant" | "error";
	content: string;
	timestamp: string;
	data?: Record<string, unknown>;
}

export interface IAIAssistantProps {
	adapter: IChatAdapter;
	theme?: "light" | "dark";
	greetingText?: string;
	headerText?: string;
	defaultFullScreen?: boolean;
	showFullScreenToggle?: boolean;
	className?: string;
	extensions?: AIAssistantExtension[];
	renderMessage?: (message: IChatMessage) => ReactNode;
	service?: IAIAssistantService;
	permissions?: AIAssistantPermission[];
	onClose?: () => void;
}
