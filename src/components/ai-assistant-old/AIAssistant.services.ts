import {
	IEntity,
	IAIAssistantAgent,
	IAIAssistantConversation,
	IAIAssistantMessage,
	IAIAssistantModel,
	IAIAssistantStarterPrompt,
	IAIAssistantTemplate,
	IAssistantConfig,
} from "./AIAssistant.models";
import { buildSystemPrompt, normalizeGeneratedHtml } from "./AIAssistant.utils";
import { getErrorMessage } from "./AIAssistant.utils";
import { ExtendedHttpAgent } from "./ag-ui/agui.client";
import {
	createAGUISubscriber,
	processToolResults,
	type ITextAccumulator,
	type IToolCallRecord,
} from "./ag-ui/agui.subscriber";
import type { Message } from "@ag-ui/core";

export interface IRunAgentRequest {
	threadId: string;
	message: string;
	messageId: string;
	model?: string;
	abortController?: AbortController;
	onUpdate?: (text: string) => void;
}

export interface IRunAgentResult {
	text: string;
	messages: Message[];
	toolCalls: IToolCallRecord[];
	error?: string;
}

/** Service interface for starter prompt CRUD — keeps StarterPromptPage decoupled from AIAssistant service. */
export interface IStarterPromptPageService {
	getStarterPrompts: () => Promise<IEntity<IAIAssistantStarterPrompt[]>>;

	addStarterPrompt: (
		prompt: IAIAssistantStarterPrompt,
	) => Promise<IEntity<IAIAssistantStarterPrompt>>;
	updateStarterPrompt: (
		prompt: IAIAssistantStarterPrompt,
	) => Promise<IEntity<IAIAssistantStarterPrompt>>;
	deleteStarterPrompt: (
		promptId: string,
		agentName?: string,
	) => Promise<IEntity<void>>;
}

/** Service interface for template CRUD — keeps TemplatePage decoupled from AIAssistant service. */
export interface ITemplatePageService {
	getTemplates: () => Promise<IEntity<IAIAssistantTemplate[]>>;
	getTemplateById: (
		templateId: string,
	) => Promise<IEntity<IAIAssistantTemplate>>;
	addTemplate: (
		template: IAIAssistantTemplate,
	) => Promise<IEntity<IAIAssistantTemplate>>;
	updateTemplate: (
		template: IAIAssistantTemplate,
	) => Promise<IEntity<IAIAssistantTemplate>>;
	deleteTemplate: (templateId: string) => Promise<IEntity<void>>;
}

export interface IAIAssistantService
	extends IStarterPromptPageService,
		ITemplatePageService {
	runAgent?: (request: IRunAgentRequest) => Promise<IRunAgentResult>;
	getConversationHistory: () => Promise<IEntity<IAIAssistantConversation[]>>;
	getConversationMessages: (
		threadId: string,
	) => Promise<IEntity<IAIAssistantMessage[]>>;
	getAIModels: () => Promise<IEntity<IAIAssistantModel[]>>;
	generateDynamicUi: (
		payload: unknown,
		customPrompt: string | undefined,
		model: string | undefined,
	) => Promise<string | undefined>;
}

interface FetchApiOptions {
	path: string;
	method: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
	errorLabel: string;
}

export class AIAssistantService implements IAIAssistantService {
	private readonly apiBaseUrl: string;
	private readonly getToken: () => Promise<string>;
	private readonly agentNames: string[];
	private readonly agentUrl: string;
	private agent: ExtendedHttpAgent | undefined;

	constructor(
		config: IAssistantConfig,
		getToken: () => Promise<string>,
		agents: IAIAssistantAgent[] = [],
	) {
		this.apiBaseUrl = config.api.baseUrl.trim();
		this.getToken = getToken;
		this.agentUrl = config.agentConfig?.url ?? "";
		this.agentNames = agents
			.map((agent) => agent.name.trim())
			.filter((agentName) => agentName.length > 0);
	}

	runAgent = async (request: IRunAgentRequest): Promise<IRunAgentResult> => {
		if (!this.agentUrl) {
			throw new Error(
				"AG-UI agent is not configured. Provide config.agentConfig.url to enable chat.",
			);
		}

		if (!this.agent) {
			this.agent = new ExtendedHttpAgent({ url: this.agentUrl });
		}

		const accessToken = await this.getRequiredAccessToken().catch(() => "");

		this.agent.threadId = request.threadId;
		this.agent.headers = accessToken
			? { Authorization: `Bearer ${accessToken}` }
			: {};
		this.agent.model = request.model;

		const acc: ITextAccumulator = { text: "", toolCalls: new Map() };

		const onUpdate = () => {
			request.onUpdate?.(acc.text || "Waiting for response...");
		};

		const userMessage: Message = {
			id: request.messageId,
			role: "user",
			content: request.message,
		};

		this.agent.setMessages([userMessage]);

		const subscriber = createAGUISubscriber(acc, onUpdate);

		const result = await this.agent.runAgent(
			{ abortController: request.abortController ?? new AbortController() },
			subscriber,
		);

		const responseMessages = result.newMessages ?? [];

		processToolResults(
			responseMessages as Array<{
				role: string;
				toolCallId?: string;
				content: unknown;
			}>,
			acc,
		);

		const assistantText = responseMessages
			.filter((msg: Message) => msg.role === "assistant")
			.map((msg: Message) => (msg as { content?: string }).content ?? "")
			.join("\n")
			.trim();

		return {
			text: assistantText || acc.text,
			messages: responseMessages,
			toolCalls: Array.from(acc.toolCalls.values()),
			error: acc.error,
		};
	};

	// ── Core fetch helper ────────────────────────────────────────────────────

	private fetchApi = async <T>(
		options: FetchApiOptions,
	): Promise<IEntity<T>> => {
		if (!this.apiBaseUrl) {
			return this.createErrorEntity("AIAssistant apiBaseUrl is required.");
		}

		try {
			const token = await this.getRequiredAccessToken();
			const headers: Record<string, string> = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				...options.headers,
			};

			const response = await fetch(`${this.apiBaseUrl}${options.path}`, {
				method: options.method,
				headers,
				body: options.body ? JSON.stringify(options.body) : undefined,
			});

			if (!response.ok) {
				throw new Error(
					`${options.errorLabel}: ${response.status} ${response.statusText}`,
				);
			}

			const data =
				options.method === "DELETE" ? undefined : await response.json();

			return this.createSuccessEntity(data as T);
		} catch (error) {
			return this.createErrorEntity(
				getErrorMessage(error, `${options.errorLabel}.`),
			);
		}
	};

	// ── Starter prompts ──────────────────────────────────────────────────────

	getStarterPrompts = async (): Promise<IEntity<IAIAssistantStarterPrompt[]>> =>
		this.fetchApi({
			path: "/starter-prompts/search",
			method: "POST",
			body: { agentNames: this.agentNames, tags: [] },
			errorLabel: "Failed to fetch starter prompts",
		});

	addStarterPrompt = async (
		prompt: IAIAssistantStarterPrompt,
	): Promise<IEntity<IAIAssistantStarterPrompt>> => {
		let normalizedPrompt: IAIAssistantStarterPrompt;
		try {
			normalizedPrompt = this.normalizeStarterPrompt(prompt);
		} catch (error) {
			return this.createErrorEntity(
				getErrorMessage(error, "Failed to create starter prompt."),
			);
		}

		return this.fetchApi({
			path: "/starter-prompts",
			method: "POST",
			body: normalizedPrompt,
			errorLabel: "Failed to create starter prompt",
		});
	};

	updateStarterPrompt = async (
		prompt: IAIAssistantStarterPrompt,
	): Promise<IEntity<IAIAssistantStarterPrompt>> => {
		let normalizedPrompt: IAIAssistantStarterPrompt;
		try {
			normalizedPrompt = this.normalizeStarterPrompt(prompt);
		} catch (error) {
			return this.createErrorEntity(
				getErrorMessage(error, "Failed to update starter prompt."),
			);
		}

		return this.fetchApi({
			path: `/starter-prompts/${encodeURIComponent(normalizedPrompt.id ?? "")}?agentName=${encodeURIComponent(normalizedPrompt.agentName ?? "")}`,
			method: "PUT",
			body: normalizedPrompt,
			errorLabel: "Failed to update starter prompt",
		});
	};

	deleteStarterPrompt = async (
		promptId: string,
		agentName?: string,
	): Promise<IEntity<void>> => {
		const normalizedPromptId = promptId.trim();
		if (!normalizedPromptId) {
			return this.createErrorEntity("Starter prompt id is required.");
		}

		const resolvedAgentName = agentName?.trim();
		if (!resolvedAgentName) {
			return this.createErrorEntity("Starter prompt agent name is required.");
		}

		return this.fetchApi({
			path: `/starter-prompts/${encodeURIComponent(normalizedPromptId)}?agentName=${encodeURIComponent(resolvedAgentName)}`,
			method: "DELETE",
			errorLabel: "Failed to delete starter prompt",
		});
	};

	// ── Conversations ────────────────────────────────────────────────────────

	getConversationHistory = async (): Promise<
		IEntity<IAIAssistantConversation[]>
	> => {
		const entity = await this.fetchApi<Partial<IAIAssistantConversation>[]>({
			path: "/conversations",
			method: "GET",
			errorLabel: "Failed to fetch conversations",
		});

		if (!entity.data) return entity as IEntity<IAIAssistantConversation[]>;

		return this.createSuccessEntity(
			entity.data
				.map((conversation) => ({
					id: `${conversation.threadId}_${conversation.agentName ?? this.getDefaultAgentName()}`,
					userOid: conversation.userOid ?? "local-user",
					threadId: conversation.threadId ?? "",
					userEmail: conversation.userEmail ?? "",
					firstMessageText:
						conversation.firstMessageText?.trim() || "Untitled conversation",
					createdAt: conversation.createdAt ?? new Date().toISOString(),
					lastActivityAt:
						conversation.lastActivityAt ??
						conversation.createdAt ??
						new Date().toISOString(),
					agentName: conversation.agentName ?? this.getDefaultAgentName(),
				}))
				.sort(
					(left, right) =>
						Date.parse(right.lastActivityAt) - Date.parse(left.lastActivityAt),
				),
		);
	};

	getConversationMessages = async (
		threadId: string,
	): Promise<IEntity<IAIAssistantMessage[]>> => {
		const normalizedThreadId = threadId.trim();
		if (!normalizedThreadId) {
			return this.createErrorEntity("Conversation threadId is required.", []);
		}

		const entity = await this.fetchApi<IAIAssistantMessage[]>({
			path: `/conversations/${encodeURIComponent(normalizedThreadId)}/messages`,
			method: "GET",
			errorLabel: `Failed to fetch messages for thread ${normalizedThreadId}`,
		});

		if (!entity.data) return entity;

		return this.createSuccessEntity(
			entity.data
				.filter((message) => message.role !== "system")
				.map((message) => ({
					id: message.id,
					messageText: message.messageText,
					serializedMessage: message.serializedMessage,
					role: message.role,
					timestamp: this.normalizeTimestamp(message.timestamp),
					partitionKey: message.partitionKey,
				})),
		);
	};

	// ── Models ───────────────────────────────────────────────────────────────

	getAIModels = async (): Promise<IEntity<IAIAssistantModel[]>> => {
		const entity = await this.fetchApi<
			Array<
				| string
				| (Partial<IAIAssistantModel> & {
						deploymentName?: string;
						name?: string;
						isEnabled?: boolean;
				  })
			>
		>({
			path: "/models",
			method: "GET",
			errorLabel: "Failed to fetch models",
		});

		if (!entity.data) return entity as IEntity<IAIAssistantModel[]>;

		const normalizedModels = entity.data
			.map((item): IAIAssistantModel | undefined => {
				if (typeof item === "string") {
					const modelName = item.trim();
					return modelName ? { label: modelName, value: modelName } : undefined;
				}

				if (item.isEnabled === false) return undefined;

				const resolvedValue = (
					item.value ??
					item.deploymentName ??
					item.name ??
					item.label
				)?.trim();

				if (!resolvedValue) return undefined;

				return {
					label: item.label?.trim() || resolvedValue,
					value: resolvedValue,
				};
			})
			.filter((model): model is IAIAssistantModel => Boolean(model?.value));

		if (normalizedModels.length === 0) {
			return this.createErrorEntity("No AI models returned from API.", []);
		}

		return this.createSuccessEntity(normalizedModels);
	};

	// ── Dynamic UI ───────────────────────────────────────────────────────────

	generateDynamicUi = async (
		payload: unknown,
		customPrompt: string | undefined,
		model: string | undefined,
	): Promise<string | undefined> => {
		const templatePrompt = [buildSystemPrompt(), customPrompt?.trim()]
			.filter(Boolean)
			.join("\n\n");

		try {
			const token = await this.getRequiredAccessToken();
			const response = await fetch(`${this.apiBaseUrl}/render/html`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					"X-Model-Deployment": model ?? "",
				},
				body: JSON.stringify({
					data: JSON.stringify(payload),
					templatePrompt,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch dynamic UI: ${response.status} ${response.statusText}`,
				);
			}
			const content = response.body ? await response.text() : "";
			return normalizeGeneratedHtml(content);
		} catch {
			return payload && typeof payload === "object"
				? JSON.stringify(payload, null, 2)
				: String(payload);
		}
	};

	// ── Templates ────────────────────────────────────────────────────────────

	getTemplates = async (): Promise<IEntity<IAIAssistantTemplate[]>> =>
		this.fetchApi({
			path: "/templates",
			method: "GET",
			errorLabel: "Failed to fetch templates",
		});

	getTemplateById = async (
		templateId: string,
	): Promise<IEntity<IAIAssistantTemplate>> => {
		const normalizedId = templateId.trim();
		if (!normalizedId) {
			return this.createErrorEntity("Template id is required.");
		}

		return this.fetchApi({
			path: `/templates/${encodeURIComponent(normalizedId)}`,
			method: "GET",
			errorLabel: "Failed to fetch template",
		});
	};

	addTemplate = async (
		template: IAIAssistantTemplate,
	): Promise<IEntity<IAIAssistantTemplate>> =>
		this.fetchApi({
			path: "/templates",
			method: "POST",
			body: {
				name: template.name,
				description: template.description,
				content: template.content,
				data: template.data,
				agents: template.agents,
			},
			errorLabel: "Failed to create template",
		});

	updateTemplate = async (
		template: IAIAssistantTemplate,
	): Promise<IEntity<IAIAssistantTemplate>> => {
		if (!template.id) {
			return this.createErrorEntity("Template id is required.");
		}

		return this.fetchApi({
			path: `/templates/${encodeURIComponent(template.id)}`,
			method: "PUT",
			body: {
				name: template.name,
				description: template.description,
				content: template.content,
				data: template.data,
				agents: template.agents,
			},
			errorLabel: "Failed to update template",
		});
	};

	deleteTemplate = async (templateId: string): Promise<IEntity<void>> => {
		const normalizedId = templateId.trim();
		if (!normalizedId) {
			return this.createErrorEntity("Template id is required.");
		}

		return this.fetchApi({
			path: `/templates/${encodeURIComponent(normalizedId)}`,
			method: "DELETE",
			errorLabel: "Failed to delete template",
		});
	};

	// ── Private helpers ──────────────────────────────────────────────────────

	private createSuccessEntity = <T>(data: T): IEntity<T> => ({
		data,
		loading: false,
	});

	private createErrorEntity = <T>(error: string, data?: T): IEntity<T> => ({
		data,
		loading: false,
		error,
	});

	private normalizeStarterPrompt = (
		prompt: IAIAssistantStarterPrompt,
	): IAIAssistantStarterPrompt => {
		const title = prompt.title.trim();
		const promptText = (prompt.prompt ?? prompt.description ?? title).trim();
		const agentName = (prompt.agentName ?? this.getDefaultAgentName()).trim();

		if (!title) {
			throw new Error("Starter prompt title is required.");
		}

		if (!agentName) {
			throw new Error("Starter prompt agent name is required.");
		}

		return {
			...prompt,
			id: prompt.id?.trim() || this.createStarterPromptId(),
			title,
			prompt: promptText,
			description: prompt.description?.trim() || promptText,
			agentName,
			parameters: prompt.parameters ?? null,
			tags: prompt.tags ?? null,
			templates: prompt.templates ?? null,
		};
	};

	private createStarterPromptId = (): string => {
		if (typeof globalThis.crypto?.randomUUID === "function") {
			return globalThis.crypto.randomUUID();
		}

		return `starter-prompt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
	};

	private getDefaultAgentName = (): string =>
		this.agentNames[0] ?? "Orchestrator";

	private normalizeTimestamp = (value: string): string => {
		const trimmed = value.trim();
		if (/[+-]\d{2}:$/.test(trimmed)) return `${trimmed}00`;
		if (/[+-]\d{2}$/.test(trimmed)) return `${trimmed}:00`;
		return trimmed;
	};

	private getRequiredAccessToken = async (): Promise<string> => {
		const token = (await this.getToken()).trim();
		if (!token) {
			throw new Error("AIAssistant access token is required.");
		}
		return token;
	};
}
