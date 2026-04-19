import { ComponentType } from "react";
import type { IAIAssistantService } from "./AIAssistant.services";

export type AIAssistantTheme =
	| "light"
	| "dark"
	| "webLight"
	| "webDark"
	| string;

export enum AIAssistantDisplayMode {
	SidePanel = "SidePanel",
	FullScreen = "FullScreen",
}

export interface IEntity<T> {
	data?: T;
	loading?: boolean;
	error?: string;
}

export interface IAIAssistantAgent {
	id?: string;
	name: string;
	description?: string;
	selected?: boolean;
}

export interface IAIAssistantConversation {
	id: string;
	userOid: string;
	threadId: string;
	userEmail: string;
	firstMessageText: string;
	createdAt: string;
	lastActivityAt: string;
	agentName: string;
}

export interface IAIAssistantMessage {
	id?: string;
	messageText: string;
	serializedMessage?: string;
	role: "user" | "assistant" | "system";
	timestamp: string;
	partitionKey: string;
}

export interface IAIAssistantStarterPrompt {
	id?: string;
	agentName?: string;
	title: string;
	description?: string;
	prompt?: string;
	parameters?: string[] | null;
	tags?: string[] | null;
	templates?: string[] | null;
}

export interface IAIAssistantTemplate {
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

export interface IAIAssistantModel {
	label: string;
	value: string;
}

export interface AgentChatAssistantResponse {
	text?: string;
	payload?: unknown;
}

export interface AgentChatRenderAssistantMessageParams {
	response: AgentChatAssistantResponse;
}

export enum AIAssistantFeature {
	ConversationHistory = "conversation_history",
	StarterPrompts = "starter_prompts",
	Templates = "templates",
	Settings = "settings",
	DynamicUi = "dynamic_ui",
	DeveloperTools = "developer_tools",
}

export const hasFeature = (
	features: AIAssistantFeature[] | undefined,
	feature: AIAssistantFeature,
): boolean => !features || features.includes(feature);

export enum AIAssistantActionType {
	SetModel = "SetModel",
	SendMessage = "SendMessage",
	CancelMessage = "CancelMessage",
	LoadConversation = "LoadConversation",
}

export interface IAssistantConfig {
	api: {
		baseUrl: string;
	};
	agentConfig: {
		url: string;
	};
}
export interface IUserInfo {
	name?: string;
	email?: string;
}
export interface IAssistantBasicProps {
	displayMode?: AIAssistantDisplayMode;
	agents?: IAIAssistantAgent[];
	greetingText?: string;
	headerText?: string;
	onClosePanel?: () => void;
	getTemplate?: (params: ITemplateInfo) => any;
}
export interface IAIAssistantBaseProps {
	className?: string;
	theme?: AIAssistantTheme;
	getToken: () => Promise<string>;
	permissions?: AIAssistantPermission[];
	userInfo?: IUserInfo;
	features?: AIAssistantFeature[];
}

export type IAIAssistantProps = IAssistantBasicProps &
	IAIAssistantBaseProps &
	(
		| { config: IAssistantConfig; service?: IAIAssistantService }
		| { config?: undefined; service: IAIAssistantService }
	);

export interface IAIAssistantState {
	starterPrompts: IEntity<IAIAssistantStarterPrompt[]>;
	templates: IEntity<IAIAssistantTemplate[]>;
	conversationHistory: IEntity<IAIAssistantConversation[]>;
	models: IEntity<IAIAssistantModel[]>;
	activeConversationMessages: IEntity<IAIAssistantMessage[]>;
	activeConversation?: IAIAssistantConversation;
	selectedModel?: IAIAssistantModel;
	isAguiInProgress: boolean;
	aguiRawData: string;
}

export interface ITemplateInfo {
	templateId: string;
	isStoredInDb?: boolean;
	data: Record<string, unknown>;
}

export type IResolvedTemplate =
	| {
			type: "component";
			component: TemplateComponent;
			data: Record<string, unknown>;
			onAction?: (action: string, payload: IActionArgs) => void;
	  }
	| { type: "html"; html: string };

export const CANCELLED_MESSAGE = "The request has been cancelled.";

export const DEFAULT_DEPLOYMENT = "gpt-5.2";
export const DEFAULT_API_VERSION = "2024-05-01-preview";
export const AI_ASSISTANT_HEADER_TEXT = "AI Assistant";

export interface ITemplateComponentProps {
	data?: Record<string, unknown>;
	onAction?: (action: string, payload: IActionArgs) => void;
}

export interface IActionArgs {
	prompt: string;
	data?: Record<string, unknown>;
}

export type TemplateComponent = ComponentType<ITemplateComponentProps>;

export interface IAiAssistantContextValue {
	theme?: AIAssistantTheme;
	userInfo?: IUserInfo;
	permissions?: AIAssistantPermission[];
	service: IAIAssistantService;
}

/**
 * Centralized permission definitions for the AI Assistant component.
 *
 * Consumers map their own role/authorization data into these permissions
 * and pass them as a prop — the component never evaluates roles directly.
 */

export enum AIAssistantPermission {
	View = "view",
	ManageTemplates = "manage_templates",
	ManageStarterPrompts = "manage_starter_prompts",
}
