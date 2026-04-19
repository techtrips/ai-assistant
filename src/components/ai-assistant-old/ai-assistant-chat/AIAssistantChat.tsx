import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Tooltip, mergeClasses, tokens } from "@fluentui/react-components";
import {
	AddRegular,
	ChatRegular,
	DismissRegular,
	DocumentRegular,
	FullScreenMaximize20Regular,
	FullScreenMinimize20Regular,
	LightbulbRegular,
	SettingsRegular,
} from "@fluentui/react-icons";
import {
	AssistantChatNavItem,
	IAssistantChatProps,
} from "./AIAssistantChat.models";
import { useInit, useSidePanelResize } from "./AIAssistantChat.hooks";
import { ChatNavBar } from "./chat-navbar/ChatNavBar";
import { ChatWindow } from "./chat-window/ChatWindow";
import { ConversationHistoryPage } from "./conversation-history-page/ConversationHistoryPage";
import { ConversationHistoryDisplayLocation } from "./conversation-history-page/ConversationHistoryPage.models";
import { SettingsPage } from "./settings-page/SettingsPage";
import { StarterPromptPage } from "./starter-prompt-page/StarterPromptPage";
import { TemplatePage } from "./template-page/TemplatePage";
import { useAIAssistantChatStyles } from "./AIAssistantChat.styles";
import {
	AI_ASSISTANT_HEADER_TEXT,
	AIAssistantActionType,
	AIAssistantDisplayMode,
	AIAssistantFeature,
	hasFeature,
	IAIAssistantConversation,
	IAIAssistantStarterPrompt,
} from "../AIAssistant.models";

export const AIAssistantChat = (props: IAssistantChatProps) => {
	const {
		agents,
		displayMode,
		models,
		selectedModel,
		starterPrompts,
		templates,
		conversationHistory,
		activeConversation,
		activeConversationMessages,
		isAguiInProgress,
		aguiRawData,
		onAction,
		headerText = AI_ASSISTANT_HEADER_TEXT,
		onClosePanel,
		onToggleDisplayMode,
		resolveTemplate,
		features,
	} = props;

	const { state, actions } = useInit(props);
	const agentClasses = useAIAssistantChatStyles();
	const [activeParameterizedPrompt, setActiveParameterizedPrompt] =
		useState<IAIAssistantStarterPrompt | null>(null);
	const focusTriggerRef = useRef(0);
	const isFullScreen = displayMode !== AIAssistantDisplayMode.SidePanel;
	const { sidePanelWidth, isResizingSidePanel, onResizeStart, onResetWidth } =
		useSidePanelResize(!isFullScreen);
	const themeVars = {
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
		"--agent-chat-sidepanel-width": `${Math.round(sidePanelWidth)}px`,
	} as CSSProperties & Record<string, string>;

	const handleNewChat = useCallback(() => {
		onAction?.(AIAssistantActionType.LoadConversation, undefined);
		actions.setInputValue("");
		actions.setActiveNav(AssistantChatNavItem.NewChat);
		focusTriggerRef.current += 1;
	}, [actions, onAction]);

	const handleCloseSidePanel = useCallback(() => {
		if (onClosePanel) {
			onClosePanel();
			return;
		}

		actions.setActiveNav(AssistantChatNavItem.NewChat);
	}, [actions, onClosePanel]);

	const handleFullScreenNavSelect = useCallback(
		(navItem: AssistantChatNavItem) => {
			actions.setActiveNav(navItem);
			if (navItem === AssistantChatNavItem.NewChat) {
				onAction?.(AIAssistantActionType.LoadConversation, undefined);
			}
		},
		[actions, onAction],
	);

	const handleSidePanelNavSelect = useCallback(
		(navItem: AssistantChatNavItem) => {
			if (navItem === AssistantChatNavItem.NewChat) {
				handleNewChat();
				return;
			}

			actions.setActiveNav(
				state.activeNavItem === navItem
					? AssistantChatNavItem.NewChat
					: navItem,
			);
		},
		[actions, handleNewChat, state.activeNavItem],
	);

	const handleConversationSelect = useCallback(
		(conversation: IAIAssistantConversation) => {
			onAction?.(AIAssistantActionType.LoadConversation, conversation);
			actions.setActiveNav(AssistantChatNavItem.NewChat);
		},
		[onAction, actions],
	);

	const handleSelectStarterPrompt = useCallback(
		(prompt: IAIAssistantStarterPrompt) => {
			const params = prompt.parameters?.filter(Boolean) ?? [];
			if (params.length > 0 && prompt.prompt) {
				setActiveParameterizedPrompt(prompt);
				return;
			}
			const message = prompt.prompt ?? prompt.title;
			onAction?.(AIAssistantActionType.SendMessage, message);
		},
		[onAction],
	);

	const handleInputChange = useCallback(
		(value: string) => {
			actions.setInputValue(value);
		},
		[actions],
	);

	const handleSendMessage = useCallback(() => {
		onAction?.(AIAssistantActionType.SendMessage, state.inputValue);
		actions.setInputValue("");
	}, [onAction, state.inputValue, actions]);

	const handleCancelMessage = useCallback(() => {
		onAction?.(AIAssistantActionType.CancelMessage);
	}, [onAction]);

	const handleModelChange = useCallback(
		(modelId: string) => {
			onAction?.(AIAssistantActionType.SetModel, modelId);
		},
		[onAction],
	);

	const handleFileUpload = useCallback(() => {}, []);
	const handleFileRemove = useCallback(() => {}, []);

	const displayModeButtonLabel = isFullScreen
		? "Switch to side panel"
		: "Switch to full screen";

	const renderChatWindow = () => (
		<ChatWindow
			models={models}
			selectedModel={selectedModel}
			activeConversation={activeConversation}
			activeConversationMessages={activeConversationMessages}
			inputValue={state.inputValue}
			starterPrompts={starterPrompts ?? { loading: false }}
			isDeveloperMode={state.isDeveloperMode}
			isAguiInProgress={isAguiInProgress}
			aguiRawData={aguiRawData}
			activeParameterizedPrompt={activeParameterizedPrompt}
			focusTrigger={focusTriggerRef.current}
			events={{
				onSelectStarterPrompt: handleSelectStarterPrompt,
				onPromptFormSubmit: (resolved) => {
					setActiveParameterizedPrompt(null);
					onAction?.(AIAssistantActionType.SendMessage, resolved);
				},
				onPromptFormCancel: () => setActiveParameterizedPrompt(null),
				onInputChange: handleInputChange,
				onModelChange: handleModelChange,
				onFileUpload: handleFileUpload,
				onFileRemove: handleFileRemove,
				onSendMessage: handleSendMessage,
				onCancelMessage: handleCancelMessage,
			}}
			resolveTemplate={state.useRawResponse ? undefined : resolveTemplate}
		/>
	);

	const renderContent = (isSidebar: boolean) => {
		const displayLocation = isSidebar
			? ConversationHistoryDisplayLocation.Sidebar
			: ConversationHistoryDisplayLocation.MainContent;

		if (state.activeNavItem === AssistantChatNavItem.Chats) {
			return (
				<ConversationHistoryPage
					conversations={conversationHistory ?? { loading: false }}
					displayLocation={displayLocation}
					onNewChat={handleNewChat}
					onSelectConversation={handleConversationSelect}
				/>
			);
		}

		if (state.activeNavItem === AssistantChatNavItem.StarterPrompts) {
			return (
				<StarterPromptPage
					agents={agents}
					isSidebar={isSidebar}
					initialData={starterPrompts}
				/>
			);
		}

		if (state.activeNavItem === AssistantChatNavItem.Templates) {
			return (
				<TemplatePage
					agents={agents}
					isSidebar={isSidebar}
					initialData={templates}
				/>
			);
		}

		if (state.activeNavItem === AssistantChatNavItem.Settings) {
			return (
				<SettingsPage
					isSidebar={isSidebar}
					isDeveloperMode={state.isDeveloperMode}
					onToggleDeveloperMode={actions.toggleDeveloperMode}
					useRawResponse={state.useRawResponse}
					onToggleRawResponse={actions.toggleRawResponse}
					features={features}
				/>
			);
		}

		return renderChatWindow();
	};

	return (
		<div
			className={
				isFullScreen
					? agentClasses.immersiveLayout
					: agentClasses.sidePanelLayout
			}
			style={themeVars}
		>
			{/* Slot 0: Left sidebar nav (fullscreen) / Stage overlay (sidepanel) */}
			{isFullScreen ? (
				<ChatNavBar
					activeNavItem={state.activeNavItem}
					isCollapsed={state.isSidebarCollapsed}
					conversations={conversationHistory?.data}
					searchQuery={state.searchQuery}
					features={features}
					onNavSelect={handleFullScreenNavSelect}
					onToggleCollapse={actions.toggleSidebar}
					onSearchChange={actions.setSearchQuery}
					onConversationSelect={handleConversationSelect}
				/>
			) : (
				<div className={agentClasses.sidePanelStage} />
			)}

			{/* Slot 1: Resize handle (sidepanel only) */}
			{!isFullScreen ? (
				<div
					className={mergeClasses(
						agentClasses.sidePanelResizeHandle,
						isResizingSidePanel && agentClasses.sidePanelResizeHandleActive,
					)}
					role="separator"
					aria-label="Resize chat panel"
					aria-orientation="vertical"
					title="Drag to resize"
					onPointerDown={onResizeStart}
					onDoubleClick={onResetWidth}
				/>
			) : null}

			{/* Slot 2: Main panel — stable tree position preserves child state across display mode changes */}
			<div
				className={
					isFullScreen
						? agentClasses.contentArea
						: mergeClasses(
								agentClasses.sidePanelDrawer,
								isResizingSidePanel && agentClasses.sidePanelDrawerResizing,
								agentClasses.rootSidePanel,
							)
				}
			>
				<div
					className={
						isFullScreen ? undefined : agentClasses.sidePanelChatColumn
					}
					style={isFullScreen ? { display: "contents" } : undefined}
				>
					{/* Header */}
					<div
						className={
							isFullScreen
								? agentClasses.immersiveHeaderBar
								: agentClasses.panelHeader
						}
					>
						{headerText.length > 30 ? (
							<Tooltip content={headerText} relationship="description">
								<span className={agentClasses.panelHeaderTitle}>
									{headerText.slice(0, 30)}…
								</span>
							</Tooltip>
						) : (
							<span className={agentClasses.panelHeaderTitle}>
								{headerText}
							</span>
						)}
						<div className={agentClasses.headerActions}>
							{/* Sidepanel inline nav buttons */}
							{!isFullScreen && (
								<>
									<button
										className={mergeClasses(
											agentClasses.sidePanelHeaderButton,
											state.activeNavItem === AssistantChatNavItem.NewChat &&
												agentClasses.sidePanelHeaderButtonActive,
										)}
										type="button"
										title="New chat"
										aria-label="New chat"
										onClick={() =>
											handleSidePanelNavSelect(AssistantChatNavItem.NewChat)
										}
									>
										<AddRegular fontSize={18} />
									</button>
									{hasFeature(
										features,
										AIAssistantFeature.ConversationHistory,
									) && (
										<button
											className={mergeClasses(
												agentClasses.sidePanelHeaderButton,
												state.activeNavItem === AssistantChatNavItem.Chats &&
													agentClasses.sidePanelHeaderButtonActive,
											)}
											type="button"
											title="Chats"
											aria-label="Chats"
											onClick={() =>
												handleSidePanelNavSelect(AssistantChatNavItem.Chats)
											}
										>
											<ChatRegular fontSize={18} />
										</button>
									)}
									{hasFeature(features, AIAssistantFeature.StarterPrompts) && (
										<button
											className={mergeClasses(
												agentClasses.sidePanelHeaderButton,
												state.activeNavItem ===
													AssistantChatNavItem.StarterPrompts &&
													agentClasses.sidePanelHeaderButtonActive,
											)}
											type="button"
											title="Starter Prompts"
											aria-label="Starter Prompts"
											onClick={() =>
												handleSidePanelNavSelect(
													AssistantChatNavItem.StarterPrompts,
												)
											}
										>
											<LightbulbRegular fontSize={18} />
										</button>
									)}
									{hasFeature(features, AIAssistantFeature.Templates) && (
										<button
											className={mergeClasses(
												agentClasses.sidePanelHeaderButton,
												state.activeNavItem ===
													AssistantChatNavItem.Templates &&
													agentClasses.sidePanelHeaderButtonActive,
											)}
											type="button"
											title="Templates"
											aria-label="Templates"
											onClick={() =>
												handleSidePanelNavSelect(AssistantChatNavItem.Templates)
											}
										>
											<DocumentRegular fontSize={18} />
										</button>
									)}
									{hasFeature(features, AIAssistantFeature.Settings) && (
										<Tooltip content="Settings" relationship="label">
											<button
												className={mergeClasses(
													agentClasses.sidePanelHeaderButton,
													state.activeNavItem ===
														AssistantChatNavItem.Settings &&
														agentClasses.sidePanelHeaderButtonActive,
												)}
												type="button"
												aria-label="Settings"
												onClick={() =>
													handleSidePanelNavSelect(
														AssistantChatNavItem.Settings,
													)
												}
											>
												<SettingsRegular fontSize={18} />
											</button>
										</Tooltip>
									)}
								</>
							)}
							{onToggleDisplayMode && (
								<button
									className={agentClasses.sidePanelHeaderButton}
									type="button"
									title={displayModeButtonLabel}
									aria-label={displayModeButtonLabel}
									onClick={() => {
										onToggleDisplayMode();
										focusTriggerRef.current += 1;
									}}
								>
									{isFullScreen ? (
										<FullScreenMinimize20Regular fontSize={18} />
									) : (
										<FullScreenMaximize20Regular fontSize={18} />
									)}
								</button>
							)}
							{onClosePanel && (
								<button
									className={agentClasses.sidePanelHeaderButton}
									type="button"
									title="Close panel"
									aria-label="Close panel"
									onClick={handleCloseSidePanel}
								>
									<DismissRegular fontSize={18} />
								</button>
							)}
						</div>
					</div>

					{/* Content — always at the same tree position so child state is preserved */}
					<div
						className={
							isFullScreen ? agentClasses.contentBody : agentClasses.contentArea
						}
					>
						{renderContent(!isFullScreen)}
					</div>
				</div>
			</div>
		</div>
	);
};
