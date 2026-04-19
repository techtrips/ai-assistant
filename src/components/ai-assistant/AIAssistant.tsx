import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type CSSProperties,
} from "react";
import { mergeClasses, tokens } from "@fluentui/react-components";
import {
	AddRegular,
	FullScreenMaximize20Regular,
	FullScreenMinimize20Regular,
	DismissRegular,
	PanelLeftRegular,
	SparkleRegular,
} from "@fluentui/react-icons";
import type { IAIAssistantProps } from "./AIAssistant.types";
import { AIAssistantContext } from "./AIAssistantContext";
import { useAIAssistantStyles } from "./AIAssistant.styles";
import { AIAssistantPermission, DEFAULT_SETTINGS } from "./AIAssistant.types";
import type { IAIAssistantSettings } from "./AIAssistant.types";
import { checkPermission } from "./AIAssistant.utils";
import { useChatState } from "./useChatState";
import { ChatArea } from "./chat-area";
import { ChatInput } from "./chat-input";
import { PromptParameterForm } from "./chat-input/prompt-parameter-form";
import { StarterPromptChips } from "./starter-prompt-chips";
import { SidebarChatHistory } from "./sidebar-chat-history";
import { useResizePanel } from "./useResizePanel";
import type { IStarterPrompt } from "./AIAssistant.types";
import { ConversationHistory } from "./extensions/conversation-history";
import { StarterPrompts } from "./extensions/starter-prompts";
import { TemplateRenderer } from "./extensions/template-renderer";
import { Settings } from "./extensions/settings";
import type { AIAssistantExtension } from "./extensions/types";

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

const CHAT_VIEW = "__chat__";
const DEFAULT_AGENT = "Default Agent";
const MOBILE_QUERY = "(max-width: 768px)";
const subscribeMobile = (cb: () => void) => {
	const mql = window.matchMedia(MOBILE_QUERY);
	mql.addEventListener("change", cb);
	return () => mql.removeEventListener("change", cb);
};
const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;

export const AIAssistant = ({
	adapter,
	theme = "light",
	greetingText,
	headerText = "AI Assistant",
	defaultFullScreen = false,
	showFullScreenToggle = true,
	className,
	extensions,
	renderMessage,
	service,
	permissions = [AIAssistantPermission.View],
	onClose,
}: IAIAssistantProps) => {
	const classes = useAIAssistantStyles();
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
	} = useChatState(adapter);

	const [starterPrompts, setStarterPrompts] = useState<IStarterPrompt[]>([]);
	const [starterPromptsLoading, setStarterPromptsLoading] = useState(true);
	const [agentNames, setAgentNames] = useState<string[]>([]);
	const [settings, setSettings] = useState<IAIAssistantSettings>(DEFAULT_SETTINGS);
	const [activeParameterizedPrompt, setActiveParameterizedPrompt] =
		useState<IStarterPrompt | null>(null);

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
			const agentsPromise = service.getAgentNames().catch(() => ({ data: [] as string[] }));
			const settingsPromise = Promise.all([
				service.getUserSettings().catch(() => ({ data: undefined })),
				service.getGlobalSettings().catch(() => ({ data: undefined })),
			]);

			Promise.all([agentsPromise, settingsPromise]).then(
				([agentsResult, [userResult, globalResult]]) => {
					if (cancelled) return;
					let allAgents = agentsResult.data ?? [];

					// If agents are empty: retry once (token may not be ready), then fall back
					if (allAgents.length === 0) {
						if (!isRetry) {
							retryTimer = setTimeout(() => { if (!cancelled) fetchAll(true); }, 1500);
							return;
						}
						allAgents = [DEFAULT_AGENT];
					}

					allAgentNamesRef.current = allAgents;

					// Merge settings
					const merged = {
						...DEFAULT_SETTINGS,
						...(globalResult.data ?? {}),
						...(userResult.data ?? {}),
					};
					if (globalResult.data?.enableTemplateResolution === false) {
						merged.enableTemplateResolution = false;
					}
					if (globalResult.data?.enableDynamicUi === false) {
						merged.enableDynamicUi = false;
					}
					setSettings(merged);

					// Filter agent names by global visible agents (empty visibleAgents = show all)
					const globalAgents = globalResult.data?.visibleAgents;
					const filteredAgents =
						globalAgents && globalAgents.length > 0
							? allAgents.filter((a) => globalAgents.includes(a))
							: allAgents;
					const effectiveAgents = filteredAgents.length > 0 ? filteredAgents : allAgents;
					setAgentNames(effectiveAgents);

					// Fetch starter prompts
					if (effectiveAgents.length > 0) {
						service.getStarterPrompts(effectiveAgents).then((promptResult) => {
							if (!cancelled && promptResult.data) {
								const sorted = [...promptResult.data].sort(
									(a, b) => (a.order ?? 0) - (b.order ?? 0),
								);
								setStarterPrompts(sorted);
							}
						}).catch(() => { /* starter prompts unavailable */ }).finally(() => {
							if (!cancelled) setStarterPromptsLoading(false);
						});
					} else {
						setStarterPromptsLoading(false);
					}
				},
			);
		};

		fetchAll();
		return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); };
	}, [service]);

	const updateSettings = useCallback(
		(
			user: Partial<IAIAssistantSettings>,
			global: Partial<IAIAssistantSettings>,
		) => {
			const merged = { ...DEFAULT_SETTINGS, ...global, ...user };
			if (global.enableTemplateResolution === false) {
				merged.enableTemplateResolution = false;
			}
			if (global.enableDynamicUi === false) {
				merged.enableDynamicUi = false;
			}
			setSettings(merged);

			// Re-filter agents based on visibleAgents
			const va = global.visibleAgents;
			const all = allAgentNamesRef.current;
			const filtered = va && va.length > 0 ? all.filter((a) => va.includes(a)) : all;
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

	const contextValue = useMemo(
		() => ({
			sendMessage,
			selectPrompt,
			activeParameterizedPrompt,
			dismissParameterizedPrompt,
			newChat,
			messages,
			setMessages,
			threadId,
			setThreadId,
			service,
			permissions,
			agentNames,
			starterPrompts,
			starterPromptsLoading,
			theme,
			settings,
			updateSettings,
		}),
		[
			sendMessage,
			selectPrompt,
			activeParameterizedPrompt,
			dismissParameterizedPrompt,
			newChat,
			messages,
			setMessages,
			threadId,
			setThreadId,
			service,
			permissions,
			agentNames,
			starterPrompts,
			starterPromptsLoading,
			theme,
			settings,
			updateSettings,
		],
	);

	const themeVars = useMemo(
		() =>
			({
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
			}) as CSSProperties & Record<string, string>,
		[],
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
		setActiveView(CHAT_VIEW);
	}, [newChat]);

	const activeExtension = visibleExtensions.find(
		(ext) => ext.extensionMeta.key === activeView,
	);

	const hasExtensions = visibleExtensions.length > 0;

	const sidebarNavItems = useMemo(
		() => [
			{ key: CHAT_VIEW, label: "New Chat", icon: AddRegular },
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

	const renderContent = () => {
		if (activeExtension) {
			const ExtComponent = activeExtension;
			return <ExtComponent onClose={handleBackToChat} />;
		}
		if (hasMessages) {
			return (
				<>
					<ChatArea
						messages={messages}
						isStreaming={isStreaming}
						streamingText={streamingText}
						renderMessage={renderMessage}
					/>
					{activeParameterizedPrompt && (
						<PromptParameterForm
							prompt={activeParameterizedPrompt}
							onSubmit={handleParameterFormSubmit}
							onCancel={dismissParameterizedPrompt}
						/>
					)}
					<ChatInput
						isStreaming={isStreaming}
						onSend={sendMessage}
						onAbort={abort}
						starterPrompts={starterPrompts}
						onSelectPrompt={selectPrompt}
					/>
				</>
			);
		}
		return (
			<div className={classes.welcomeContainer}>
				<div className={classes.welcomeCenter}>
					<SparkleRegular
						className={classes.welcomeIcon}
						fontSize={effectiveFullScreen ? 48 : 40}
					/>
					<h1
						className={mergeClasses(
							classes.welcomeHeading,
							effectiveFullScreen && classes.welcomeHeadingFullScreen,
						)}
					>
						<span className={classes.welcomeHeadingStrong}>Hello,</span>
						{greetingText ?? "How can I assist you?"}
					</h1>
					<div
						className={mergeClasses(
							classes.welcomeComposer,
							effectiveFullScreen && classes.welcomeComposerFullScreen,
						)}
					>
						{activeParameterizedPrompt && (
							<PromptParameterForm
								prompt={activeParameterizedPrompt}
								onSubmit={handleParameterFormSubmit}
								onCancel={dismissParameterizedPrompt}
							/>
						)}
						<ChatInput
							isStreaming={isStreaming}
							onSend={sendMessage}
							onAbort={abort}
							starterPrompts={starterPrompts}
							onSelectPrompt={selectPrompt}
						/>
						<StarterPromptChips />
					</div>
				</div>
			</div>
		);
	};

	return (
		<AIAssistantContext.Provider value={contextValue}>
			<div
				className={mergeClasses(
					className ?? classes.root,
					effectiveFullScreen && classes.rootFullScreen,
				)}
				style={{
					...themeVars,
					...(isSidePanel ? { width: sidePanelWidth } : undefined),
				}}
			>
				{/* Resize handle — side-panel only */}
				{isSidePanel && (
					<div
						className={mergeClasses(
							classes.resizeHandle,
							isResizing && classes.resizeHandleActive,
						)}
						role="separator"
						aria-label="Resize chat panel"
						aria-orientation="vertical"
						title="Drag to resize"
						onPointerDown={onResizeStart}
					/>
				)}

				{/* Header bar */}
				<div className={classes.header}>
					<span className={classes.headerTitle}>{headerText}</span>
					<div className={classes.headerActions}>
						{!effectiveFullScreen && hasExtensions && (
							<>
								<button
									className={classes.headerButton}
									type="button"
									title="New chat"
									aria-label="New chat"
									onClick={handleNewChat}
								>
									<AddRegular fontSize={18} />
								</button>
								{visibleExtensions.map((ext) => (
									<button
										key={ext.extensionMeta.key}
										className={mergeClasses(
											classes.headerButton,
											activeView === ext.extensionMeta.key &&
												classes.headerButtonActive,
										)}
										type="button"
										title={ext.extensionMeta.label}
										aria-label={ext.extensionMeta.label}
										onClick={() => handleNavSelect(ext.extensionMeta.key)}
									>
										<ext.extensionMeta.icon fontSize={18} />
									</button>
								))}
							</>
						)}
						{showFullScreenToggle && (
							<button
							className={mergeClasses(classes.headerButton, classes.headerButtonHideMobile)}
								type="button"
								title={
									effectiveFullScreen
										? "Switch to side panel"
										: "Switch to full screen"
								}
								aria-label={
									effectiveFullScreen
										? "Switch to side panel"
										: "Switch to full screen"
								}
								onClick={handleToggleFullScreen}
							>
								{effectiveFullScreen ? (
									<FullScreenMinimize20Regular fontSize={18} />
								) : (
									<FullScreenMaximize20Regular fontSize={18} />
								)}
							</button>
						)}
						{onClose && (
							<button
								className={classes.headerButton}
								type="button"
								title="Close panel"
								aria-label="Close panel"
								onClick={onClose}
							>
								<DismissRegular fontSize={18} />
							</button>
						)}
					</div>
				</div>

				{/* Body: sidebar (full-screen) + content */}
				{effectiveFullScreen && hasExtensions ? (
					<div className={classes.immersiveLayout}>
						<div
							className={mergeClasses(
								classes.sidebar,
								isSidebarCollapsed
									? classes.sidebarCollapsed
									: classes.sidebarExpanded,
							)}
						>
							<div
								className={mergeClasses(
									classes.sidebarTopBar,
									!isSidebarCollapsed && classes.sidebarTopBarExpanded,
								)}
							>
								{!isSidebarCollapsed && (
									<SparkleRegular
										fontSize={20}
										style={{
											color: "var(--agent-chat-brand)",
											marginLeft: 4,
										}}
									/>
								)}
								<button
									className={classes.sidebarToggle}
									type="button"
									title={
										isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
									}
									aria-label={
										isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
									}
									onClick={handleToggleSidebar}
								>
									<PanelLeftRegular fontSize={20} />
								</button>
							</div>
							<nav className={classes.sidebarNav}>
								{sidebarNavItems.map((item) => (
									<button
										key={item.key}
										className={mergeClasses(
											classes.sidebarNavButton,
											!isSidebarCollapsed && classes.sidebarNavButtonExpanded,
											activeView === item.key &&
												(item.key !== CHAT_VIEW || !hasMessages) &&
												classes.sidebarNavButtonActive,
										)}
										type="button"
										title={item.label}
										aria-label={item.label}
										onClick={() =>
											item.key === CHAT_VIEW
												? handleNewChat()
												: handleNavSelect(item.key)
										}
									>
										<span className={classes.sidebarNavIcon}>
											<item.icon fontSize={20} />
										</span>
										{!isSidebarCollapsed && (
											<span className={classes.sidebarNavLabel}>
												{item.label}
											</span>
										)}
									</button>
								))}
							</nav>
							{!isSidebarCollapsed && (
								<SidebarChatHistory onSelect={handleBackToChat} showSelection={activeView === CHAT_VIEW} />
							)}
						</div>
						<div className={classes.contentBody}>{renderContent()}</div>
					</div>
				) : (
					<div className={classes.contentBody}>{renderContent()}</div>
				)}
			</div>
		</AIAssistantContext.Provider>
	);
};
