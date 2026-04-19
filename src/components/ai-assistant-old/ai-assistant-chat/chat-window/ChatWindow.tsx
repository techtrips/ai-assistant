import { IChatWindowProps } from "./ChatWindow.models";
import { useAIAssistantChatStyles } from "../AIAssistantChat.styles";
import { ChatArea } from "./chat-area/ChatArea";
import { ChatInput } from "./chat-input/ChatInput";
import { PromptParameterForm } from "./prompt-parameter-form/PromptParameterForm";
import { StarterPromptSuggesstion } from "./starter-prompt-suggesstion/StarterPromptSuggesstion";

export const ChatWindow = (props: IChatWindowProps) => {
	const {
		models,
		selectedModel,
		activeConversation,
		activeConversationMessages,
		inputValue,
		starterPrompts,
		isDeveloperMode,
		isAguiInProgress,
		aguiRawData,
		activeParameterizedPrompt,
		events,
		resolveTemplate,
		focusTrigger,
	} = props;

	const {
		onSelectStarterPrompt,
		onPromptFormSubmit,
		onPromptFormCancel,
		onInputChange,
		onModelChange,
		onFileUpload,
		onFileRemove,
		onSendMessage,
		onCancelMessage,
	} = events;

	const classes = useAIAssistantChatStyles();

	const promptForm = activeParameterizedPrompt && (
		<div className={classes.promptFormDock}>
			<div className={classes.promptFormDockInner}>
				<PromptParameterForm
					open={!!activeParameterizedPrompt}
					title={activeParameterizedPrompt.title}
					promptTemplate={activeParameterizedPrompt.prompt ?? ""}
					parameters={activeParameterizedPrompt.parameters ?? []}
					templateType={
						activeParameterizedPrompt.templates?.[0] ?? "placeholder_text"
					}
					onSubmit={(resolved) => onPromptFormSubmit?.(resolved)}
					onCancel={() => onPromptFormCancel?.()}
				/>
			</div>
		</div>
	);

	const chatInput = (
		<ChatInput
			models={models}
			selectedModel={selectedModel}
			inputValue={inputValue}
			starterPrompts={starterPrompts}
			isPromptProcessing={isAguiInProgress ?? false}
			focusTrigger={focusTrigger}
			onSelectStarterPrompt={onSelectStarterPrompt}
			onInputChange={onInputChange}
			onModelChange={onModelChange}
			onFileUpload={onFileUpload}
			onFileRemove={onFileRemove}
			onSendMessage={onSendMessage}
			onCancelMessage={onCancelMessage}
		/>
	);

	if (activeConversation) {
		return (
			<div className={classes.root}>
				<ChatArea
					activeConversation={activeConversation}
					messages={activeConversationMessages}
					isDeveloperMode={isDeveloperMode}
					isAguiInProgress={isAguiInProgress}
					aguiRawData={aguiRawData}
					resolveTemplate={resolveTemplate}
				/>
				{promptForm}
				{chatInput}
			</div>
		);
	}

	return (
		<div className={classes.root}>
			<div className={classes.welcomeContainer}>
				<h1 className={classes.welcomeHeading}>
					<span className={classes.welcomeHeadingStrong}>Hello,</span>
					How can I assist you?
				</h1>
				<div className={classes.welcomeComposerContainer}>
					{promptForm}
					{chatInput}
					{!activeParameterizedPrompt && (
						<StarterPromptSuggesstion
							prompts={starterPrompts}
							onSelectPrompt={onSelectStarterPrompt}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
