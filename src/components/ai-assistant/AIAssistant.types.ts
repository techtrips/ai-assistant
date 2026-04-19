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
	agents: string[];
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
}

export interface IChatMessage {
	id: string;
	role: "user" | "assistant" | "error";
	content: string;
	timestamp: string;
	data?: Record<string, unknown>;
}

export interface IAIAssistantAgent {
	name: string;
	description?: string;
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
	agents?: IAIAssistantAgent[];
	onClose?: () => void;
}
