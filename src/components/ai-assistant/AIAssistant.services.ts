import type {
	IAIAssistantSettings,
	IChatMessage,
	IConversation,
	IStarterPrompt,
	ITemplate,
} from "./AIAssistant.types";

/* ── Service contracts ── */

export interface IEntity<T> {
	data?: T;
	loading?: boolean;
	error?: string;
}

export interface IStarterPromptService {
	getStarterPrompts: (
		agentNames?: string[],
	) => Promise<IEntity<IStarterPrompt[]>>;
	addStarterPrompt: (
		prompt: IStarterPrompt,
	) => Promise<IEntity<IStarterPrompt>>;
	updateStarterPrompt: (
		prompt: IStarterPrompt,
	) => Promise<IEntity<IStarterPrompt>>;
	deleteStarterPrompt: (
		promptId: string,
		agentName?: string,
	) => Promise<IEntity<void>>;
}

export interface ITemplateService {
	getTemplates: () => Promise<IEntity<ITemplate[]>>;
	getTemplateById: (templateId: string) => Promise<IEntity<ITemplate>>;
	getAgentNames: () => Promise<IEntity<string[]>>;
	getToolNames: (agent: string) => Promise<IEntity<string[]>>;
	addTemplate: (template: ITemplate) => Promise<IEntity<ITemplate>>;
	updateTemplate: (template: ITemplate) => Promise<IEntity<ITemplate>>;
	deleteTemplate: (templateId: string) => Promise<IEntity<void>>;
}

export interface IConversationMessagesResponse {
	messages: IChatMessage[];
	totalCount: number;
	page: number;
	pageSize: number;
}

export interface IConversationHistoryResponse {
	conversations: IConversation[];
	totalCount: number;
	page: number;
	pageSize: number;
}

export interface IConversationService {
	getConversationHistory: (
		page?: number,
		pageSize?: number,
		search?: string,
	) => Promise<IEntity<IConversationHistoryResponse>>;
	getConversationMessages: (
		threadId: string,
		page?: number,
		pageSize?: number,
	) => Promise<IEntity<IConversationMessagesResponse>>;
	generateDynamicUi: (
		data: string,
		prompt: string,
		model?: string,
	) => Promise<string | undefined>;
}

export interface ISettingsService {
	/** Get user-level settings */
	getUserSettings: () => Promise<IEntity<Partial<IAIAssistantSettings>>>;
	/** Save user-level settings */
	saveUserSettings: (
		settings: Partial<IAIAssistantSettings>,
	) => Promise<IEntity<Partial<IAIAssistantSettings>>>;
	/** Get global settings (admin-level, applies to all users) */
	getGlobalSettings: () => Promise<IEntity<Partial<IAIAssistantSettings>>>;
	/** Save global settings (admin only) */
	saveGlobalSettings: (
		settings: Partial<IAIAssistantSettings>,
	) => Promise<IEntity<Partial<IAIAssistantSettings>>>;
}

export interface IAIAssistantService
	extends IStarterPromptService,
		ITemplateService,
		IConversationService,
		ISettingsService {}

export interface ICreateServiceOptions {
	baseUrl: string;
	getToken: () => Promise<string>;
}

export class AIAssistantService implements IAIAssistantService {
	private readonly baseUrl: string;
	private readonly getToken: () => Promise<string>;

	constructor(options: ICreateServiceOptions) {
		this.baseUrl = options.baseUrl;
		this.getToken = options.getToken;
	}

	private async fetchApi<T>(
		path: string,
		method: "GET" | "POST" | "PUT" | "DELETE",
		body?: unknown,
	): Promise<IEntity<T>> {
		if (!this.baseUrl)
			return { error: "API base URL is required.", loading: false };
		try {
			const token = await this.getToken();
			if (!token) return { error: "Access token is required.", loading: false };
			const res = await fetch(`${this.baseUrl}${path}`, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: body ? JSON.stringify(body) : undefined,
			});
			if (!res.ok) {
				throw new Error(`HTTP ${res.status} ${res.statusText}`);
			}
			const data = method === "DELETE" ? undefined : await res.json();
			return { data: data as T, loading: false };
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			return { error: msg, loading: false };
		}
	}

	// Starter Prompts
	getStarterPrompts(agentNames?: string[]): Promise<IEntity<IStarterPrompt[]>> {
		return this.fetchApi("/starter-prompts/search", "POST", {
			agentNames: agentNames ?? [],
			tags: [],
		});
	}

	addStarterPrompt(prompt: IStarterPrompt): Promise<IEntity<IStarterPrompt>> {
		return this.fetchApi("/starter-prompts", "POST", prompt);
	}

	updateStarterPrompt(
		prompt: IStarterPrompt,
	): Promise<IEntity<IStarterPrompt>> {
		return this.fetchApi(
			`/starter-prompts/${prompt.id}?agentName=${encodeURIComponent(prompt.agentName ?? "")}`,
			"PUT",
			prompt,
		);
	}

	deleteStarterPrompt(
		promptId: string,
		agentName?: string,
	): Promise<IEntity<void>> {
		return this.fetchApi(
			`/starter-prompts/${promptId}${agentName ? `?agentName=${encodeURIComponent(agentName)}` : ""}`,
			"DELETE",
		);
	}

	// Templates
	getTemplates(): Promise<IEntity<ITemplate[]>> {
		return this.fetchApi("/templates", "GET");
	}

	getTemplateById(templateId: string): Promise<IEntity<ITemplate>> {
		return this.fetchApi(`/templates/${templateId}`, "GET");
	}

	getToolNames(agent: string): Promise<IEntity<string[]>> {
		return this.fetchApi(
			`/templates/tools?agent=${encodeURIComponent(agent)}`,
			"GET",
		);
	}

	getAgentNames(): Promise<IEntity<string[]>> {
		return this.fetchApi("/templates/agents", "GET");
	}

	addTemplate(template: ITemplate): Promise<IEntity<ITemplate>> {
		return this.fetchApi("/templates", "POST", template);
	}

	updateTemplate(template: ITemplate): Promise<IEntity<ITemplate>> {
		return this.fetchApi(`/templates/${template.id}`, "PUT", template);
	}

	deleteTemplate(templateId: string): Promise<IEntity<void>> {
		return this.fetchApi(`/templates/${templateId}`, "DELETE");
	}

	// Conversation History
	getConversationHistory(
		page = 1,
		pageSize = 20,
		search?: string,
	): Promise<IEntity<IConversationHistoryResponse>> {
		const params = new URLSearchParams({
			page: String(page),
			pageSize: String(pageSize),
		});
		if (search) params.set("search", search);
		return this.fetchApi(`/conversations?${params}`, "GET");
	}

	async getConversationMessages(
		threadId: string,
		page = 1,
		pageSize = 20,
	): Promise<IEntity<IConversationMessagesResponse>> {
		return this.fetchApi<IConversationMessagesResponse>(
			`/conversations/${threadId}/messages?page=${page}&pageSize=${pageSize}`,
			"GET",
		);
	}

	/**
	 * Calls the /render/html endpoint with data and a system prompt.
	 * Prompt construction and response normalization are handled by the caller.
	 */
	async generateDynamicUi(
		data: string,
		prompt: string,
		model?: string,
	): Promise<string | undefined> {
		try {
			const token = await this.getToken();
			if (!token) return undefined;
			const res = await fetch(`${this.baseUrl}/render/html`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					"X-Model-Deployment": model ?? "",
				},
				body: JSON.stringify({ data, prompt }),
			});
			if (!res.ok) return undefined;
			const raw = await res.text();
			return raw?.trim() || undefined;
		} catch {
			return undefined;
		}
	}

	/* ── Settings ── */

	getUserSettings(): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi("/settings/user", "GET");
	}

	saveUserSettings(
		settings: Partial<IAIAssistantSettings>,
	): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi("/settings/user", "PUT", settings);
	}

	getGlobalSettings(): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi("/settings/global", "GET");
	}

	saveGlobalSettings(
		settings: Partial<IAIAssistantSettings>,
	): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi("/settings/global", "PUT", settings);
	}
}
