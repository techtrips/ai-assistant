import { tokens } from "@fluentui/react-components";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type {
	IAIAssistantProps,
	IAIAssistantSettings,
	IStarterPrompt,
} from "./AIAssistant.types";
import {
	AIAssistantPermission,
	DEFAULT_ENABLED_RENDERERS,
	DEFAULT_SETTINGS,
} from "./AIAssistant.types";
import { checkPermission } from "./AIAssistant.utils";
import type { IAIAssistantContextValue } from "./AIAssistantContext";
import { ConversationHistory } from "./extensions/conversation-history";
import { Settings } from "./extensions/settings";
import { StarterPrompts } from "./extensions/starter-prompts";
import { TemplateRenderer } from "./extensions/template-renderer";
import type { AIAssistantExtension } from "./extensions/types";
import { useChatState } from "./useChatState";
import { useResizePanel } from "./useResizePanel";

const EXTENSION_PERMISSIONS: Record<string, AIAssistantPermission> = {
	prompts: AIAssistantPermission.ManageStarterPrompts,
	templates: AIAssistantPermission.ManageTemplates,
};

const DEFAULT_EXTENSIONS: AIAssistantExtension[] = [
	ConversationHistory,
	StarterPrompts,
	TemplateRenderer,
	Settings,
];

export const CHAT_VIEW = "__chat__";

export const THEME_VARS = {
	"--agent-chat-bg": tokens.colorNeutralBackground2,
	"--agent-chat-fg": tokens.colorNeutralForeground1,
	"--agent-chat-brand": tokens.colorBrandBackground,
	"--agent-chat-brand-hover": tokens.colorBrandBackgroundHover,
	"--agent-chat-surface": tokens.colorNeutralBackground1,
	"--agent-chat-border": tokens.colorNeutralStroke2,
	"--agent-chat-hover": tokens.colorNeutralBackground1Hover,
	"--agent-chat-muted": tokens.colorNeutralForeground3,
	"--agent-chat-user-fg": tokens.colorNeutralForegroundOnBrand,
	"--agent-chat-card": tokens.colorNeutralBackground1,
	"--agent-chat-sidebar-bg": tokens.colorNeutralBackground3,
} as CSSProperties & Record<string, string>;

const DEFAULT_AGENT = "Default Agent";
const MOBILE_QUERY = "(max-width: 768px)";
const subscribeMobile = (cb: () => void) => {
	const mql = window.matchMedia(MOBILE_QUERY);
	mql.addEventListener("change", cb);
	return () => mql.removeEventListener("change", cb);
};
const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;

export const useAIAssistant = ({
	chatAdapter,
	theme = "light",
	defaultFullScreen = false,
	extensions,
	service,
	permissions = [AIAssistantPermission.View],
	context,
	messageRenderers,
}: Pick<
	IAIAssistantProps,
	| "chatAdapter"
	| "theme"
	| "defaultFullScreen"
	| "extensions"
	| "service"
	| "permissions"
	| "context"
	| "messageRenderers"
>) => {
	const isMobile = useSyncExternalStore(subscribeMobile, getIsMobile);
	const [isFullScreen, setIsFullScreen] = useState(defaultFullScreen);
	const effectiveFullScreen = isFullScreen && !isMobile;
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [activeView, setActiveView] = useState(CHAT_VIEW);

	const {
		messages,
		setMessages,
		threadId,
		setThreadId,
		isStreaming,
		streamingText,
		sendMessage,
		abort,
		newChat,
	} = useChatState(chatAdapter);

	const [starterPrompts, setStarterPrompts] = useState<IStarterPrompt[]>([]);
	const [starterPromptsLoading, setStarterPromptsLoading] = useState(true);
	const [agentNames, setAgentNames] = useState<string[]>([]);
	const [settings, setSettings] =
		useState<IAIAssistantSettings>(DEFAULT_SETTINGS);
	const [activeParameterizedPrompt, setActiveParameterizedPrompt] =
		useState<IStarterPrompt | null>(null);

	// Pagination state for conversation history
	const [totalMessageCount, setTotalMessageCount] = useState(0);
	const loadingMoreRef = useRef(false);
	const paginationRef = useRef({ page: 1, threadId: "" });

	const isSidePanel = !effectiveFullScreen;
	const {
		width: sidePanelWidth,
		isResizing,
		onResizeStart,
	} = useResizePanel(isSidePanel);

	// Keep a ref of all agent names (unfiltered) for re-filtering
	const allAgentNamesRef = useRef<string[]>([]);

	useEffect(() => {
		if (!service) return;
		let cancelled = false;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;

		const fetchAll = (isRetry = false) => {
			const agentsPromise = service
				.getAgentNames()
				.catch(() => ({ data: [] as string[] }));
			const settingsPromise = Promise.all([
				service.getUserSettings().catch(() => ({ data: undefined })),
				service.getGlobalSettings().catch(() => ({ data: undefined })),
			]);

			Promise.all([agentsPromise, settingsPromise]).then(
				([agentsResult, [userResult, globalResult]]) => {
					if (cancelled) return;
					let allAgents = agentsResult.data ?? [];

					if (allAgents.length === 0) {
						if (!isRetry) {
							retryTimer = setTimeout(() => {
								if (!cancelled) fetchAll(true);
							}, 1500);
							return;
						}
						allAgents = [DEFAULT_AGENT];
					}

					allAgentNamesRef.current = allAgents;

					const merged = {
						...DEFAULT_SETTINGS,
						...(globalResult.data ?? {}),
						...(userResult.data ?? {}),
					};
					// Global enabledRenderers always wins (admin-controlled)
					merged.enabledRenderers = {
						...DEFAULT_ENABLED_RENDERERS,
						...(globalResult.data?.enabledRenderers ?? {}),
					};
					setSettings(merged);

					const globalAgents = globalResult.data?.visibleAgents;
					const filteredAgents =
						globalAgents && globalAgents.length > 0
							? allAgents.filter((a) => globalAgents.includes(a))
							: allAgents;
					const effectiveAgents =
						filteredAgents.length > 0 ? filteredAgents : allAgents;
					setAgentNames(effectiveAgents);

					if (effectiveAgents.length > 0) {
						service
							.getStarterPrompts(effectiveAgents)
							.then((promptResult) => {
								if (!cancelled && promptResult.data) {
									const sorted = [...promptResult.data].sort(
										(a, b) => (a.order ?? 0) - (b.order ?? 0),
									);
									setStarterPrompts(sorted);
								}
							})
							.catch(() => {
								/* starter prompts unavailable */
							})
							.finally(() => {
								if (!cancelled) setStarterPromptsLoading(false);
							});
					} else {
						setStarterPromptsLoading(false);
					}
				},
			);
		};

		fetchAll();
		return () => {
			cancelled = true;
			if (retryTimer) clearTimeout(retryTimer);
		};
	}, [service]);

	const updateSettings = useCallback(
		(
			user: Partial<IAIAssistantSettings>,
			global: Partial<IAIAssistantSettings>,
		) => {
			const merged = { ...DEFAULT_SETTINGS, ...global, ...user };
			// Global enabledRenderers always wins (admin-controlled)
			merged.enabledRenderers = {
				...DEFAULT_ENABLED_RENDERERS,
				...(global.enabledRenderers ?? {}),
			};
			setSettings(merged);

			const va = global.visibleAgents;
			const all = allAgentNamesRef.current;
			const filtered =
				va && va.length > 0 ? all.filter((a) => va.includes(a)) : all;
			setAgentNames(filtered.length > 0 ? filtered : all);
		},
		[],
	);

	const selectPrompt = useCallback(
		(prompt: IStarterPrompt) => {
			const params = prompt.parameters;
			if (params && params.length > 0) {
				setActiveParameterizedPrompt(prompt);
			} else {
				sendMessage(prompt.prompt ?? prompt.title);
			}
		},
		[sendMessage],
	);

	const dismissParameterizedPrompt = useCallback(() => {
		setActiveParameterizedPrompt(null);
	}, []);

	const refreshStarterPrompts = useCallback(() => {
		if (!service || agentNames.length === 0) return;
		service
			.getStarterPrompts(agentNames)
			.then((result) => {
				if (result.data) {
					const sorted = [...result.data].sort(
						(a, b) => (a.order ?? 0) - (b.order ?? 0),
					);
					setStarterPrompts(sorted);
				}
			})
			.catch(() => {
				/* ignore */
			});
	}, [service, agentNames]);

	const loadOlderMessages = useCallback(() => {
		if (!service || loadingMoreRef.current) return;
		const { page, threadId: paginatedThreadId } = paginationRef.current;
		if (!paginatedThreadId || paginatedThreadId !== threadId) return;

		loadingMoreRef.current = true;
		const nextPage = page + 1;
		service
			.getConversationMessages(paginatedThreadId, nextPage)
			.then((result) => {
				if (result.data) {
					paginationRef.current.page = nextPage;
					setTotalMessageCount(result.data.totalCount);
					const olderMessages = result.data.messages;
					setMessages((prev) => [...olderMessages, ...prev]);
				}
			})
			.catch(() => {
				/* ignore */
			})
			.finally(() => {
				loadingMoreRef.current = false;
			});
	}, [service, threadId, setMessages]);

	const selectConversation = useCallback(
		async (selectedThreadId: string) => {
			if (!service) return;
			const result = await service.getConversationMessages(selectedThreadId);
			setThreadId(selectedThreadId);
			if (result.data) {
				setMessages(result.data.messages);
				setTotalMessageCount(result.data.totalCount);
				paginationRef.current = { page: 1, threadId: selectedThreadId };
			} else {
				setMessages([]);
				setTotalMessageCount(0);
				paginationRef.current = { page: 1, threadId: "" };
			}
		},
		[service, setMessages, setThreadId],
	);

	const filteredStarterPrompts = useMemo(() => {
		if (!context) return starterPrompts;
		const { page, url, tags: contextTags, ...rest } = context;
		const keywords: string[] = [];
		if (page) keywords.push(page.toLowerCase());
		if (url) keywords.push(url.toLowerCase());
		if (contextTags) {
			for (const t of contextTags) keywords.push(t.toLowerCase());
		}
		for (const v of Object.values(rest)) {
			if (typeof v === "string" && v.trim()) keywords.push(v.toLowerCase());
		}
		if (keywords.length === 0) return starterPrompts;

		const matched = starterPrompts.filter((p) => {
			const promptTags = (p.tags ?? []).map((t) => t.toLowerCase());
			const title = p.title.toLowerCase();
			const desc = (p.description ?? "").toLowerCase();
			const name = (p.agentName ?? "").toLowerCase();
			return keywords.some(
				(kw) =>
					promptTags.some((t) => t.includes(kw) || kw.includes(t)) ||
					title.includes(kw) ||
					desc.includes(kw) ||
					name.includes(kw),
			);
		});
		return matched.length > 0 ? matched : starterPrompts;
	}, [starterPrompts, context]);

	const contextValue: IAIAssistantContextValue = useMemo(
		() => ({
			sendMessage,
			selectPrompt,
			activeParameterizedPrompt,
			dismissParameterizedPrompt,
			newChat,
			selectConversation,
			messages,
			setMessages,
			threadId,
			setThreadId,
			totalMessageCount,
			loadOlderMessages,
			service,
			permissions,
			agentNames,
			starterPrompts: filteredStarterPrompts,
			starterPromptsLoading,
			refreshStarterPrompts,
			theme,
			settings,
			messageRenderers,
			updateSettings,
		}),
		[
			sendMessage,
			selectPrompt,
			activeParameterizedPrompt,
			dismissParameterizedPrompt,
			newChat,
			selectConversation,
			messages,
			setMessages,
			threadId,
			setThreadId,
			totalMessageCount,
			loadOlderMessages,
			service,
			permissions,
			agentNames,
			filteredStarterPrompts,
			starterPromptsLoading,
			refreshStarterPrompts,
			theme,
			settings,
			messageRenderers,
			updateSettings,
		],
	);

	const hasMessages = messages.length > 0 || isStreaming;

	const visibleExtensions = useMemo(
		() =>
			(extensions ?? DEFAULT_EXTENSIONS).filter((ext) => {
				const required = EXTENSION_PERMISSIONS[ext.extensionMeta.key];
				return !required || checkPermission(permissions, required);
			}),
		[extensions, permissions],
	);

	const handleToggleFullScreen = useCallback(() => {
		setIsFullScreen((prev) => {
			const next = !prev;
			if (next && activeView === "chats") {
				setActiveView(CHAT_VIEW);
			}
			return next;
		});
	}, [activeView]);

	const handleToggleSidebar = useCallback(() => {
		setIsSidebarCollapsed((prev) => !prev);
	}, []);

	const handleNavSelect = useCallback((key: string) => {
		setActiveView((prev) => (prev === key ? CHAT_VIEW : key));
	}, []);

	const handleParameterFormSubmit = useCallback(
		(resolvedPrompt: string) => {
			setActiveParameterizedPrompt(null);
			sendMessage(resolvedPrompt);
		},
		[sendMessage],
	);

	const handleBackToChat = useCallback(() => {
		setActiveView(CHAT_VIEW);
	}, []);

	const handleNewChat = useCallback(() => {
		newChat();
		setTotalMessageCount(0);
		paginationRef.current = { page: 1, threadId: "" };
		setActiveView(CHAT_VIEW);
	}, [newChat]);

	const activeExtension = visibleExtensions.find(
		(ext) => ext.extensionMeta.key === activeView,
	);

	const hasExtensions = visibleExtensions.length > 0;

	const sidebarNavItems = useMemo(
		() => [
			...visibleExtensions
				.filter((ext) => ext.extensionMeta.key !== "chats")
				.map((ext) => ({
					key: ext.extensionMeta.key,
					label: ext.extensionMeta.label,
					icon: ext.extensionMeta.icon,
				})),
		],
		[visibleExtensions],
	);

	return {
		// Layout state
		isMobile,
		effectiveFullScreen,
		isSidebarCollapsed,
		isSidePanel,
		sidePanelWidth,
		isResizing,
		activeView,

		// Chat state
		messages,
		isStreaming,
		streamingText,
		totalMessageCount,
		loadOlderMessages,
		sendMessage,
		abort,
		starterPrompts,
		activeParameterizedPrompt,
		dismissParameterizedPrompt,
		selectPrompt,

		// Context
		contextValue,
		themeVars: THEME_VARS,

		// Computed
		hasMessages,
		hasExtensions,
		visibleExtensions,
		activeExtension,
		sidebarNavItems,

		// Handlers
		onResizeStart,
		handleToggleFullScreen,
		handleToggleSidebar,
		handleNavSelect,
		handleParameterFormSubmit,
		handleBackToChat,
		handleNewChat,
	};
};
