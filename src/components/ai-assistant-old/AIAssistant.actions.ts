import {
	AIAssistantActionType,
	AIAssistantFeature,
	hasFeature,
	IEntity,
	IAIAssistantConversation,
	IAIAssistantMessage,
	IAIAssistantModel,
	IAIAssistantStarterPrompt,
	IAIAssistantTemplate,
	IAIAssistantProps,
	IResolvedTemplate,
	ITemplateInfo,
	IAIAssistantState,
} from "./AIAssistant.models";
import {
	IAIAssistantService,
	type IRunAgentResult,
} from "./AIAssistant.services";
import { TemplateRenderer } from "../templates/template-renderer/TemplateRenderer";
import {
	buildCacheKey,
	buildPayloadFromToolCalls,
	buildRawToolPayload,
	createAssistantMessage,
	createConversation,
	createThreadId,
	extractCustomPrompt,
	extractRenderablePayload,
	getErrorMessage,
	hasRegisteredTemplate,
	isConversation,
	shouldRenderHelloWorldTemplate,
} from "./AIAssistant.utils";

export enum AI_ASSISTANT_DISPATCH_ACTIONS {
	SET_STARTER_PROMPTS = "SET_STARTER_PROMPTS",
	SET_TEMPLATES = "SET_TEMPLATES",
	SET_CONVERSATION_HISTORY = "SET_CONVERSATION_HISTORY",
	SET_MODELS = "SET_MODELS",
	SET_SELECTED_MODEL = "SET_SELECTED_MODEL",
	SET_ACTIVE_CONVERSATION_MESSAGES = "SET_ACTIVE_CONVERSATION_MESSAGES",
	SET_ACTIVE_CONVERSATION = "SET_ACTIVE_CONVERSATION",
	SET_AGUI_IN_PROGRESS = "SET_AGUI_IN_PROGRESS",
	SET_AGUI_RAW_DATA = "SET_AGUI_RAW_DATA",
}

export type IAIAssistantDispatchActions =
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_STARTER_PROMPTS;
			data: IEntity<IAIAssistantStarterPrompt[]>;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_TEMPLATES;
			data: IEntity<IAIAssistantTemplate[]>;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_CONVERSATION_HISTORY;
			data: IEntity<IAIAssistantConversation[]>;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_MODELS;
			data: IEntity<IAIAssistantModel[]>;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES;
			data: IEntity<IAIAssistantMessage[]>;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_SELECTED_MODEL;
			data?: IAIAssistantModel;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION;
			data?: IAIAssistantConversation;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_IN_PROGRESS;
			data: boolean;
	  }
	| {
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_RAW_DATA;
			data: string;
	  };

export interface IAIAssistantActions {
	initialize: () => Promise<void>;
	setActiveConversation: (conversation?: IAIAssistantConversation) => void;
	setSelectedModel: (modelId?: string) => void;
	handleAction: (
		action: AIAssistantActionType,
		payload?: unknown,
	) => Promise<unknown>;
	resolveTemplate: (
		templateInfo: ITemplateInfo | undefined,
		userMessageText: string | undefined,
		payload: unknown,
		customPrompt: string | undefined,
		signal: AbortSignal,
	) => Promise<IResolvedTemplate | undefined>;
}

export class AIAssistantActions implements IAIAssistantActions {
	private readonly dispatch: React.Dispatch<IAIAssistantDispatchActions>;
	private readonly getState: () => IAIAssistantState;
	private readonly service: IAIAssistantService;
	private props: IAIAssistantProps;
	private abortController: AbortController | null = null;
	private readonly resolveTemplateCache = new Map<
		string,
		IResolvedTemplate | undefined
	>();

	constructor(
		dispatch: React.Dispatch<IAIAssistantDispatchActions>,
		getState: () => IAIAssistantState,
		service: IAIAssistantService,
		props: IAIAssistantProps,
	) {
		this.dispatch = dispatch;
		this.getState = getState;
		this.service = service;
		this.props = props;
	}

	public updateProps(props: IAIAssistantProps) {
		this.props = props;
	}

	public resolveTemplate = async (
		templateInfo: ITemplateInfo | undefined,
		_userMessageText: string | undefined,
		payload: unknown,
		customPrompt: string | undefined,
		_signal: AbortSignal,
	): Promise<IResolvedTemplate | undefined> => {
		const cacheKey = buildCacheKey(templateInfo, payload, customPrompt);
		if (this.resolveTemplateCache.has(cacheKey)) {
			return this.resolveTemplateCache.get(cacheKey);
		}

		if (templateInfo && this.props.getTemplate) {
			const component = this.props.getTemplate(templateInfo);
			if (component) {
				const result: IResolvedTemplate = {
					type: "component",
					component,
					data: templateInfo.data,
					onAction: (_action, args) => {
						if (args.prompt) {
							this.handleAction(AIAssistantActionType.SendMessage, args.prompt);
						}
					},
				};
				this.resolveTemplateCache.set(cacheKey, result);
				return result;
			}
		}

		// Try fetching the template config from the server
		if (templateInfo?.templateId && templateInfo?.isStoredInDb) {
			const entity = await this.service.getTemplateById(
				templateInfo.templateId,
			);
			const serverConfig = entity.data?.content
				? (JSON.parse(entity.data.content) as Record<string, unknown>)
				: undefined;
			if (serverConfig) {
				const result: IResolvedTemplate = {
					type: "component",
					component: TemplateRenderer,
					data: {
						template: serverConfig,
						serverData: templateInfo.data,
					},
					onAction: (_action, args) => {
						if (args.prompt) {
							this.handleAction(AIAssistantActionType.SendMessage, args.prompt);
						}
					},
				};
				this.resolveTemplateCache.set(cacheKey, result);
				return result;
			}
		}

		const isDynamicUiAllowed = hasFeature(
			this.props.features,
			AIAssistantFeature.DynamicUi,
		);
		const html = isDynamicUiAllowed
			? await this.service.generateDynamicUi(
					payload,
					customPrompt,
					this.getState().selectedModel?.value,
				)
			: undefined;

		const result = html ? { type: "html" as const, html } : undefined;
		this.resolveTemplateCache.set(cacheKey, result);
		return result;
	};

	private abortActiveRun = () => {
		this.abortController?.abort();
		this.abortController = null;

		// Add a cancelled message to the conversation
		const state = this.getState();
		const currentMessages = state.activeConversationMessages.data ?? [];
		const threadId = state.activeConversation?.threadId ?? "";
		const cancelledMessage = createAssistantMessage(
			"The request has been cancelled.",
			threadId,
		);
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
			data: {
				data: [...currentMessages, cancelledMessage],
				loading: false,
			},
		});

		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_IN_PROGRESS,
			data: false,
		});
	};

	public initialize = async () => {
		const state = this.getState();

		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_STARTER_PROMPTS,
			data: { data: state.starterPrompts.data, loading: true },
		});
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_TEMPLATES,
			data: { data: state.templates.data, loading: true },
		});
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_CONVERSATION_HISTORY,
			data: { data: state.conversationHistory.data, loading: true },
		});
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_MODELS,
			data: { data: state.models.data, loading: true },
		});
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
			data: {
				data: state.activeConversationMessages.data ?? [],
				loading: false,
			},
		});

		try {
			const [
				starterPromptsEntity,
				templatesEntity,
				conversationHistoryEntity,
				modelsEntity,
			] = await Promise.all([
				this.service.getStarterPrompts(),
				this.service.getTemplates(),
				this.service.getConversationHistory(),
				this.service.getAIModels(),
			]);

			const starterPrompts: IEntity<IAIAssistantStarterPrompt[]> = {
				data: starterPromptsEntity.data ?? state.starterPrompts.data ?? [],
				loading: starterPromptsEntity.loading ?? false,
				error: starterPromptsEntity.error,
			};
			const templates: IEntity<IAIAssistantTemplate[]> = {
				data: templatesEntity.data ?? state.templates.data ?? [],
				loading: templatesEntity.loading ?? false,
				error: templatesEntity.error,
			};
			const conversationHistory: IEntity<IAIAssistantConversation[]> = {
				data:
					conversationHistoryEntity.data ??
					state.conversationHistory.data ??
					[],
				loading: conversationHistoryEntity.loading ?? false,
				error: conversationHistoryEntity.error,
			};
			const models: IEntity<IAIAssistantModel[]> = {
				data: modelsEntity.data ?? state.models.data ?? [],
				loading: modelsEntity.loading ?? false,
				error: modelsEntity.error,
			};
			const selectedModel =
				models.data?.find(
					(model) => model.value === this.getState().selectedModel?.value,
				) ??
				models.data?.[0] ??
				this.getState().selectedModel;

			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_STARTER_PROMPTS,
				data: starterPrompts,
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_TEMPLATES,
				data: templates,
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_CONVERSATION_HISTORY,
				data: conversationHistory,
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_MODELS,
				data: models,
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_SELECTED_MODEL,
				data: selectedModel,
			});
		} catch (error) {
			console.error(
				"[AIAssistant] Failed to initialize assistant data.",
				error,
			);
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_STARTER_PROMPTS,
				data: {
					data: state.starterPrompts.data ?? [],
					loading: false,
					error: "Unable to load starter prompts.",
				},
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_TEMPLATES,
				data: {
					data: state.templates.data ?? [],
					loading: false,
					error: "Unable to load templates.",
				},
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_CONVERSATION_HISTORY,
				data: {
					data: state.conversationHistory.data ?? [],
					loading: false,
					error: "Unable to load conversation history.",
				},
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_MODELS,
				data: {
					data: state.models.data ?? [],
					loading: false,
					error: "Unable to load AI models.",
				},
			});
		}
	};

	public setActiveConversation = (conversation?: IAIAssistantConversation) => {
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION,
			data: conversation,
		});
	};

	public setSelectedModel = (modelId?: string) => {
		const models = this.getState().models.data ?? [];
		const selectedModel =
			models.find((model) => model.value === modelId) ??
			(modelId ? { label: modelId, value: modelId } : models[0]);

		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_SELECTED_MODEL,
			data: selectedModel,
		});
	};

	public handleAction = async (
		action: AIAssistantActionType,
		payload?: unknown,
	): Promise<unknown> => {
		switch (action) {
			case AIAssistantActionType.SetModel:
				this.setSelectedModel(
					typeof payload === "string" ? payload : undefined,
				);
				return undefined;
			case AIAssistantActionType.SendMessage:
				return this.handleSendMessage(
					typeof payload === "string" ? payload : "",
				);
			case AIAssistantActionType.CancelMessage:
				this.abortActiveRun();
				return undefined;
			case AIAssistantActionType.LoadConversation:
				return this.handleLoadConversation(
					isConversation(payload) ? payload : undefined,
				);
			default:
				return undefined;
		}
	};

	private handleLoadConversation = async (
		conversation?: IAIAssistantConversation,
	) => {
		this.setActiveConversation(conversation);

		if (!conversation) {
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
				data: { data: [], loading: false },
			});
			return;
		}

		// Clear old messages immediately so the UI shows a loading state
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
			data: { data: [], loading: true },
		});

		const messagesEntity = await this.service.getConversationMessages(
			conversation.threadId,
		);

		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
			data: {
				data: messagesEntity.data ?? [],
				loading: messagesEntity.loading ?? false,
				error: messagesEntity.error,
			},
		});
	};

	private handleSendMessage = async (messageText: string) => {
		const normalizedMessage = messageText.trim();

		if (!normalizedMessage) {
			return;
		}

		const state = this.getState();
		const activeConversation = state.activeConversation;
		const now = new Date().toISOString();
		const threadId = activeConversation?.threadId ?? createThreadId();
		const agentName =
			activeConversation?.agentName ||
			state.starterPrompts.data?.[0]?.agentName ||
			"Orchestrator";
		const userMessage: IAIAssistantMessage = {
			id: `msg_${Date.now()}`,
			messageText: normalizedMessage,
			role: "user",
			timestamp: now,
			partitionKey: threadId,
		};
		const nextConversation = activeConversation
			? {
					...activeConversation,
					lastActivityAt: now,
					agentName,
				}
			: createConversation(normalizedMessage, agentName, now, threadId);
		const conversationHistory = state.conversationHistory.data ?? [];
		const currentMessages = state.activeConversationMessages.data ?? [];

		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_CONVERSATION_HISTORY,
			data: {
				data: [
					nextConversation,
					...conversationHistory.filter(
						(item) => item.id !== nextConversation.id,
					),
				],
				loading: false,
			},
		});
		this.setActiveConversation(nextConversation);

		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
			data: {
				data: [...currentMessages, userMessage],
				loading: true,
			},
		});

		//Mock Template testing

		if (shouldRenderHelloWorldTemplate(normalizedMessage)) {
			this.abortController?.abort();
			this.abortController = null;

			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_IN_PROGRESS,
				data: false,
			});
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_RAW_DATA,
				data: "",
			});

			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
				data: {
					data: [...currentMessages, userMessage],
					loading: false,
				},
			});

			return;
		}

		//End of Mock template testing

		// Cancel any ongoing request and prepare a new abort controller
		this.abortController?.abort();
		this.abortController = new AbortController();

		// Set AGUI streaming state
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_IN_PROGRESS,
			data: true,
		});
		this.dispatch({
			type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_RAW_DATA,
			data: "",
		});

		try {
			if (!this.service.runAgent) {
				throw new Error(
					"AG-UI agent is not configured. Provide a service with runAgent or use config.agentConfig.url.",
				);
			}

			const agentResult: IRunAgentResult = await this.service.runAgent({
				threadId,
				message: normalizedMessage,
				messageId: userMessage.id ?? `msg_${Date.now()}`,
				model: this.getState().selectedModel?.value,
				abortController: this.abortController,
				onUpdate: (text) => {
					this.dispatch({
						type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_RAW_DATA,
						data: text,
					});
				},
			});

			// Handle agent-level errors (streaming errors, run failures)
			if (agentResult.error) {
				const errorMessage = createAssistantMessage(
					agentResult.error,
					threadId,
				);
				this.dispatch({
					type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
					data: {
						data: [...currentMessages, userMessage, errorMessage],
						loading: false,
						error: agentResult.error,
					},
				});
				return;
			}

			const responseMessages = agentResult.messages;
			const allToolCalls = agentResult.toolCalls;
			const hasToolResults = allToolCalls.some((tc) => tc.result);
			const toolCallResults = allToolCalls.filter((tc) => tc.result);
			const renderPayload =
				buildPayloadFromToolCalls(toolCallResults) ??
				extractRenderablePayload(responseMessages);

			const assistantText = agentResult.text;

			// Final raw data update
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_RAW_DATA,
				data: assistantText || "No response received.",
			});

			const assistantMessages =
				assistantText || renderPayload !== undefined
					? [
							createAssistantMessage(
								assistantText || "",
								threadId,
								renderPayload,
							),
						]
					: [];

			// Generate dynamic UI when tool calls returned data but no registered
			// template matches.  Use the structured payload if available, otherwise
			// fall back to raw tool result strings so the AI can still render them.
			const needsAI =
				hasFeature(this.props.features, AIAssistantFeature.DynamicUi) &&
				hasToolResults &&
				assistantMessages.length > 0 &&
				!hasRegisteredTemplate(renderPayload);

			if (needsAI) {
				const aiPayload =
					renderPayload ?? buildRawToolPayload(allToolCalls, assistantText);

				try {
					const generatedHtml = await this.service.generateDynamicUi(
						aiPayload,
						extractCustomPrompt(renderPayload),
						this.getState().selectedModel?.value,
					);
					if (generatedHtml) {
						assistantMessages[0].serializedMessage = JSON.stringify({
							__generatedHtml: generatedHtml,
							__payload: aiPayload,
						});
					}
				} catch (err) {
					console.error("[AIAssistant] Dynamic UI generation failed:", err);
				}
			}

			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
				data: {
					data: [...currentMessages, userMessage, ...assistantMessages],
					loading: false,
				},
			});
		} catch (error) {
			// If the request was aborted, treat it as a user-initiated cancel
			if (this.abortController?.signal.aborted) {
				return;
			}

			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES,
				data: {
					data: [...currentMessages, userMessage],
					loading: false,
					error: getErrorMessage(error, "Unable to send message."),
				},
			});
		} finally {
			this.abortController = null;
			this.dispatch({
				type: AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_IN_PROGRESS,
				data: false,
			});
		}
	};
}
