import type {
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

export interface IConversationService {
	getConversationHistory: () => Promise<IEntity<IConversation[]>>;
	getConversationMessages: (
		threadId: string,
	) => Promise<IEntity<IChatMessage[]>>;
	generateDynamicUi: (
		data: string,
		prompt: string,
		model?: string,
	) => Promise<string | undefined>;
}

export interface IAIAssistantService
	extends IStarterPromptService,
		ITemplateService,
		IConversationService {}

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
	getConversationHistory(): Promise<IEntity<IConversation[]>> {
		return this.fetchApi("/conversations", "GET");
	}

	async getConversationMessages(
		threadId: string,
	): Promise<IEntity<IChatMessage[]>> {
		const result = await this.fetchApi<
			{
				id?: string;
				messageText: string;
				serializedMessage?: string;
				role: string;
				timestamp: string;
				templateId?: string;
			}[]
		>(`/conversations/${threadId}/messages`, "GET");
		if (result.error || !result.data)
			return { error: result.error, loading: result.loading };

		// Merge tool call messages into the final text response — mirrors how
		// the live AG-UI adapter accumulates tool calls across a turn and
		// attaches them to the text-done event as `data: { toolCalls: [...] }`.
		const messages: IChatMessage[] = [];
		const pendingToolCalls = new Map<
			string,
			{ id: string; name: string; args?: string; result?: string }
		>();

		for (const m of result.data) {
			if (m.role === "system") continue;

			const parsed = m.serializedMessage
				? this.parseSerialized(m.serializedMessage)
				: null;

			// Tool-role messages: extract results into pendingToolCalls, then skip
			if (m.role === "tool") {
				if (parsed) {
					for (const tr of parsed.toolResults) {
						const existing = pendingToolCalls.get(tr.id);
						if (existing) {
							existing.result = tr.result;
						} else {
							pendingToolCalls.set(tr.id, {
								id: tr.id,
								name: "",
								result: tr.result,
							});
						}
					}
				}
				continue;
			}

			// Accumulate function calls and results without emitting a message
			if (parsed?.onlyToolContent) {
				for (const tc of parsed.toolCalls) {
					const existing = pendingToolCalls.get(tc.id);
					if (existing) {
						if (tc.args) existing.args = tc.args;
						if (tc.result) existing.result = tc.result;
					} else {
						pendingToolCalls.set(tc.id, { ...tc });
					}
				}
				for (const tr of parsed.toolResults) {
					const existing = pendingToolCalls.get(tr.id);
					if (existing) {
						existing.result = tr.result;
					} else {
						pendingToolCalls.set(tr.id, {
							id: tr.id,
							name: "",
							result: tr.result,
						});
					}
				}
				continue;
			}

			// Skip empty messages with no content
			if (!m.messageText && !parsed?.hasText) continue;

			// Attach any accumulated tool calls to this text message
			let data: Record<string, unknown> | undefined;
			const msgToolCalls = parsed?.toolCalls ?? [];
			const allToolCalls = [...pendingToolCalls.values(), ...msgToolCalls];
			if (allToolCalls.length > 0) {
				data = { toolCalls: allToolCalls };
				pendingToolCalls.clear();
			}

			// Carry templateId from stored message into data
			if (m.templateId) {
				data = { ...data, templateId: m.templateId };
			}

			messages.push({
				id: m.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
				role: m.role as "user" | "assistant",
				content: m.messageText,
				timestamp: m.timestamp,
				data,
			});
		}

		return { data: messages };
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

	/**
	 * Parses a serialized Microsoft.Extensions.AI ChatMessage and extracts
	 * tool call info plus flags about the content composition.
	 */
	private parseSerialized(serialized: string) {
		try {
			const msg = JSON.parse(serialized);
			const contents: unknown[] = msg?.contents ?? [];
			if (!Array.isArray(contents)) return null;

			const toolCalls: {
				id: string;
				name: string;
				args?: string;
				result?: string;
			}[] = [];
			const toolResults: { id: string; result: string }[] = [];
			let hasText = false;
			let hasFunctionCall = false;
			let hasFunctionResult = false;

			for (const item of contents as Record<string, unknown>[]) {
				const type = (item?.$type as string) ?? "";
				if (type === "text" || type.includes("Text")) {
					const text = item?.text as string;
					if (text?.trim()) hasText = true;
				}
				if (
					(type === "functionCall" || type.includes("FunctionCall")) &&
					item?.callId
				) {
					hasFunctionCall = true;
					toolCalls.push({
						id: item.callId as string,
						name: (item.name as string) ?? "",
						args: item.arguments ? JSON.stringify(item.arguments) : undefined,
					});
				}
				if (
					(type === "functionResult" || type.includes("FunctionResult")) &&
					item?.callId
				) {
					hasFunctionResult = true;
					const result =
						typeof item.result === "string"
							? item.result
							: JSON.stringify(item.result);
					toolResults.push({ id: item.callId as string, result });
				}
			}

			const onlyToolContent =
				(hasFunctionCall || hasFunctionResult) && !hasText;

			return { toolCalls, toolResults, hasText, onlyToolContent };
		} catch {
			return null;
		}
	}
}
