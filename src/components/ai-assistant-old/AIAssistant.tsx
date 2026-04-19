import { useCallback, useEffect, useMemo, useState } from "react";
import {
	AIAssistantActionType,
	AIAssistantDisplayMode,
	IAIAssistantProps,
} from "./AIAssistant.models";
import { useInit } from "./AIAssistant.hooks";
import { useAIAssistantStyles } from "./AIAssistant.styles";
import { AIAssistantChat } from "./ai-assistant-chat";
import { AiAssistantContext } from "./AiAssistant.context";
import { mergeClasses } from "@fluentui/react-components";

const resolveDisplayMode = (displayMode?: AIAssistantDisplayMode) =>
	displayMode ?? AIAssistantDisplayMode.FullScreen;

export const AIAssistantOld = (props: IAIAssistantProps) => {
	const {
		theme,
		displayMode,
		agents,
		greetingText,
		headerText,
		className,
		onClosePanel,
		userInfo,
		permissions = [],
	} = props;
	const classes = useAIAssistantStyles();
	const { state, actions, service } = useInit(props);

	const [currentDisplayMode, setCurrentDisplayMode] = useState(() =>
		resolveDisplayMode(displayMode),
	);

	useEffect(() => {
		setCurrentDisplayMode(resolveDisplayMode(displayMode));
	}, [displayMode]);

	const handleAction = (action: AIAssistantActionType, payload?: unknown) => {
		return actions.handleAction(action, payload);
	};

	const handleToggleDisplayMode = useCallback(() => {
		setCurrentDisplayMode((previousMode) =>
			previousMode === AIAssistantDisplayMode.SidePanel
				? AIAssistantDisplayMode.FullScreen
				: AIAssistantDisplayMode.SidePanel,
		);
	}, []);

	const contextValue = useMemo(
		() => ({ theme, userInfo, permissions, service }),
		[theme, userInfo, permissions, service],
	);

	return (
		<AiAssistantContext.Provider value={contextValue}>
			<div className={mergeClasses(classes.root, className)}>
				<AIAssistantChat
					displayMode={currentDisplayMode}
					agents={agents}
					greetingText={greetingText}
					headerText={headerText}
					onClosePanel={onClosePanel}
					models={state.models}
					selectedModel={state.selectedModel}
					starterPrompts={state.starterPrompts}
					templates={state.templates}
					conversationHistory={state.conversationHistory}
					activeConversation={state.activeConversation}
					activeConversationMessages={state.activeConversationMessages}
					isAguiInProgress={state.isAguiInProgress}
					aguiRawData={state.aguiRawData}
					onAction={handleAction}
					onToggleDisplayMode={handleToggleDisplayMode}
					resolveTemplate={actions.resolveTemplate}
					features={props.features}
				/>
			</div>
		</AiAssistantContext.Provider>
	);
};
