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

/**
 * One row in the agent activity log for a thread. Captured server-side
 * from the AG-UI event stream and replayed back via
 * `IConversationService.getThreadEvents`. The shape intentionally mirrors
 * what a debug pane wants to render — not the raw AG-UI event union.
 */
export interface IThreadEvent {
	/** Stable id for React keying / dedup. */
	id: string;
	/** ISO timestamp the event occurred. */
	timestamp: string;
	/** Optional run grouping (one user turn = one runId). */
	runId?: string;
	/**
	 * Logical agent that produced this event. For multi-agent flows this
	 * lets the UI label rows ("Orchestrator", "Ordering", etc.). For
	 * single-agent setups, leave undefined or set to the agent's name.
	 */
	agent?: string;
	/**
	 * What kind of activity this row represents.
	 * - `tool-call` / `tool-result`: local function tool invoked in-process by the agent.
	 * - `mcp-call` / `mcp-result`: tool exposed by a remote MCP server.
	 * - `a2a-call` / `a2a-result`: delegation to another agent over the A2A protocol.
	 */
	role:
		| "user"
		| "assistant"
		| "tool-call"
		| "tool-result"
		| "mcp-call"
		| "mcp-result"
		| "a2a-call"
		| "a2a-result"
		| "error";
	/** Tool name when the row represents a tool/MCP/A2A invocation. */
	toolName?: string;
	/**
	 * Human-readable / JSON-stringified content. The viewer renders this
	 * verbatim in a monospace block; the server is expected to format it
	 * for display (pretty-printed JSON for tool results, plain text for
	 * assistant prose, etc.).
	 */
	content: string;
}

export interface IThreadEventsResponse {
	threadId: string;
	events: IThreadEvent[];
	totalCount: number;
	page: number;
	pageSize: number;
}

export interface IThreadTurn {
	/** Run id (matches IThreadEvent.runId). */
	runId: string;
	/** Truncated user prompt to display in the dropdown. */
	label: string;
	/** ISO timestamp of the user message that started this turn. */
	firstSeen: string;
}

export interface IThreadTurnsResponse {
	threadId: string;
	turns: IThreadTurn[];
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
	/**
	 * Fetch the raw activity log (user + assistant turns + tool calls /
	 * results) for a thread. Drives the Raw Logs side panel. Optional —
	 * services that don't expose this endpoint can omit it and the panel
	 * will display a friendly "not available" message.
	 */
	getThreadEvents?: (
		threadId: string,
		page?: number,
		pageSize?: number,
	) => Promise<IEntity<IThreadEventsResponse>>;
	/**
	 * Fetch the list of distinct turns (one per user message) for a
	 * thread. Used to populate the Logs panel turn dropdown without
	 * paginating through all events. Optional.
	 */
	getThreadTurns?: (threadId: string) => Promise<IEntity<IThreadTurnsResponse>>;
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
	/**
	 * Optional agent scope. When set, the service constrains
	 * conversations, starter prompts, agent names, templates, and
	 * settings (user + global) to this agent so embeds (e.g. the Agent
	 * Playground) don't share state with the host app's other agents.
	 */
	agentName?: string;
}

export class AIAssistantService implements IAIAssistantService {
	private readonly baseUrl: string;
	private readonly getToken: () => Promise<string>;
	private readonly agentName?: string;

	constructor(options: ICreateServiceOptions) {
		this.baseUrl = options.baseUrl;
		this.getToken = options.getToken;
		this.agentName = options.agentName;
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
		// When the service is scoped to a specific agent, ignore the caller's
		// list and constrain to that agent so embeds (e.g. Agent Playground)
		// don't surface prompts from the host app's other agents.
		const effectiveAgents = this.agentName
			? [this.agentName]
			: (agentNames ?? []);
		return this.fetchApi("/starter-prompts/search", "POST", {
			agentNames: effectiveAgents,
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
		const qs = this.agentName
			? `?agentName=${encodeURIComponent(this.agentName)}`
			: "";
		return this.fetchApi(`/templates${qs}`, "GET");
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
		// When scoped, short-circuit so consumers see only the configured agent
		// (avoids loading every agent's starter prompts/templates upstream).
		if (this.agentName) {
			return Promise.resolve({ data: [this.agentName], loading: false });
		}
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
		if (this.agentName) params.set("agentName", this.agentName);
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
	 * Default implementation calls `GET /conversations/{threadId}/events`.
	 * Backends that don't expose that endpoint should override this method
	 * (or delete the property) when constructing the service.
	 */
	async getThreadEvents(
		threadId: string,
		page = 1,
		pageSize = 50,
	): Promise<IEntity<IThreadEventsResponse>> {
		return this.fetchApi<IThreadEventsResponse>(
			`/conversations/${threadId}/events?page=${page}&pageSize=${pageSize}`,
			"GET",
		);
	}

	/**
	 * Default implementation calls `GET /conversations/{threadId}/turns`.
	 */
	async getThreadTurns(
		threadId: string,
	): Promise<IEntity<IThreadTurnsResponse>> {
		return this.fetchApi<IThreadTurnsResponse>(
			`/conversations/${threadId}/turns`,
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

	private settingsQuery(): string {
		return this.agentName
			? `?agentName=${encodeURIComponent(this.agentName)}`
			: "";
	}

	getUserSettings(): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi(`/settings/user${this.settingsQuery()}`, "GET");
	}

	saveUserSettings(
		settings: Partial<IAIAssistantSettings>,
	): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi(
			`/settings/user${this.settingsQuery()}`,
			"PUT",
			settings,
		);
	}

	getGlobalSettings(): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi(`/settings/global${this.settingsQuery()}`, "GET");
	}

	saveGlobalSettings(
		settings: Partial<IAIAssistantSettings>,
	): Promise<IEntity<Partial<IAIAssistantSettings>>> {
		return this.fetchApi(
			`/settings/global${this.settingsQuery()}`,
			"PUT",
			settings,
		);
	}
}
