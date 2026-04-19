import { mergeClasses } from "@fluentui/react-components";
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
import { ChatArea } from "./chat-area";
import { ChatInput } from "./chat-input";
import { PromptParameterForm } from "./chat-input/prompt-parameter-form";
import { StarterPromptChips } from "./starter-prompt-chips";
import { SidebarChatHistory } from "./sidebar-chat-history";
import { useAIAssistant, CHAT_VIEW } from "./useAIAssistant";

export const AIAssistant = (props: IAIAssistantProps) => {
	const {
		greetingText,
		headerText = "AI Assistant",
		showFullScreenToggle = true,
		className,
		renderMessage,
		onClose,
	} = props;

	const classes = useAIAssistantStyles();
	const {
		effectiveFullScreen,
		isSidebarCollapsed,
		isSidePanel,
		sidePanelWidth,
		isResizing,
		activeView,
		messages,
		isStreaming,
		streamingText,
		sendMessage,
		abort,
		starterPrompts,
		activeParameterizedPrompt,
		dismissParameterizedPrompt,
		selectPrompt,
		contextValue,
		themeVars,
		hasMessages,
		hasExtensions,
		visibleExtensions,
		activeExtension,
		sidebarNavItems,
		onResizeStart,
		handleToggleFullScreen,
		handleToggleSidebar,
		handleNavSelect,
		handleParameterFormSubmit,
		handleBackToChat,
		handleNewChat,
	} = useAIAssistant(props);

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
