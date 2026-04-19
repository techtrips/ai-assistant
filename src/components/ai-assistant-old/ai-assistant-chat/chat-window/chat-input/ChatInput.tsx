import { useCallback, useMemo, useRef } from "react";
import {
	Menu,
	MenuItem,
	MenuList,
	MenuPopover,
	MenuTrigger,
	mergeClasses,
} from "@fluentui/react-components";
import {
	AttachRegular,
	SendRegular,
	DesktopRegular,
	ChevronDownRegular,
	Stop16Filled,
} from "@fluentui/react-icons";
import { IChatInputProps } from "./ChatInput.models";
import { useChatInputStyles } from "./ChatInput.styles";
import {
	useAutoFocus,
	useChatInputState,
	useAutocompleteSuggestions,
	useVoiceInput,
} from "./ChatInput.hooks";
import { VoiceInput } from "./voice-input/VoiceInput";

export const ChatInput = (props: IChatInputProps) => {
	const {
		models,
		selectedModel,
		inputValue,
		starterPrompts,
		isPromptProcessing,
		focusTrigger,
		onSelectStarterPrompt,
		onInputChange,
		onModelChange,
		onSendMessage,
		onCancelMessage,
	} = props;

	const classes = useChatInputStyles();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const availableModels = models?.data ?? [];
	const defaultSelectedModel =
		selectedModel?.value ?? availableModels[0]?.value ?? "gpt-4.1";

	useAutoFocus(textareaRef, focusTrigger);
	const { state, setState } = useChatInputState(
		inputValue,
		defaultSelectedModel,
	);

	const selectedModelLabel = useMemo(
		() =>
			availableModels.find((model) => model.value === state.selectedModel)
				?.label ?? state.selectedModel,
		[availableModels, state.selectedModel],
	);

	const {
		showSuggestions,
		setShowSuggestions,
		selectedIndex: selectedSuggestionIndex,
		setSelectedIndex: setSelectedSuggestionIndex,
		filtered: filteredSuggestions,
		select: handleSelectSuggestion,
	} = useAutocompleteSuggestions(
		state.inputValue,
		starterPrompts?.data,
		onSelectStarterPrompt,
	);

	const voice = useVoiceInput(state.inputValue, setState, onInputChange);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const value = e.target.value;
			setState((prev) => ({ ...prev, inputValue: value }));
			onInputChange(value);
			setShowSuggestions(value.trim().length > 0);
		},
		[onInputChange],
	);

	const handleSend = useCallback(() => {
		if (!state.inputValue.trim() || isPromptProcessing) return;
		setShowSuggestions(false);
		onSendMessage();
		setState((prev) => ({ ...prev, inputValue: "" }));
	}, [state.inputValue, isPromptProcessing, onSendMessage]);

	const handleModelSelect = useCallback(
		(modelValue: string) => {
			setState((prev) => ({ ...prev, selectedModel: modelValue }));
			onModelChange(modelValue);
		},
		[onModelChange],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			const hasSuggestions = showSuggestions && filteredSuggestions.length > 0;

			if (hasSuggestions) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					setSelectedSuggestionIndex((prev) =>
						prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
					);
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					setSelectedSuggestionIndex((prev) =>
						prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
					);
					return;
				}
				if (e.key === "Enter" && !e.shiftKey && selectedSuggestionIndex >= 0) {
					e.preventDefault();
					handleSelectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					setShowSuggestions(false);
					return;
				}
			}

			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[
			handleSend,
			showSuggestions,
			filteredSuggestions,
			selectedSuggestionIndex,
			handleSelectSuggestion,
		],
	);

	const hasInput = state.inputValue.trim().length > 0;

	return (
		<div className={classes.wrapper}>
			{showSuggestions && filteredSuggestions.length > 0 && (
				<div className={classes.suggestionsDropdown}>
					{filteredSuggestions.map((sp, index) => (
						<button
							key={sp.id ?? index}
							className={mergeClasses(
								classes.suggestionItem,
								index === selectedSuggestionIndex &&
									classes.suggestionItemActive,
							)}
							onMouseDown={(e) => {
								e.preventDefault();
								handleSelectSuggestion(sp);
							}}
							onMouseEnter={() => setSelectedSuggestionIndex(index)}
							type="button"
						>
							<div className={classes.suggestionTitle}>{sp.title}</div>
							<div className={classes.suggestionPrompt}>{sp.prompt}</div>
						</button>
					))}
				</div>
			)}
			<div className={classes.composer}>
				<textarea
					ref={textareaRef}
					className={classes.textarea}
					placeholder="Ask anything"
					value={state.inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => {
						if (state.inputValue.trim().length > 0) setShowSuggestions(true);
					}}
					onBlur={() => {
						// Small delay so mousedown on suggestion fires before blur hides it
						setTimeout(() => setShowSuggestions(false), 150);
					}}
					rows={1}
				/>
				<div className={classes.footer}>
					<div className={classes.leftTools}>
						<Menu positioning="below-start">
							<MenuTrigger disableButtonEnhancement>
								<button className={classes.modelButton} type="button">
									<DesktopRegular fontSize={16} />
									<span>{selectedModelLabel}</span>
									<ChevronDownRegular fontSize={12} />
								</button>
							</MenuTrigger>
							<MenuPopover>
								<MenuList>
									{availableModels.map((model) => (
										<MenuItem
											key={model.value}
											onClick={() => handleModelSelect(model.value)}
										>
											{model.label}
										</MenuItem>
									))}
								</MenuList>
							</MenuPopover>
						</Menu>
						<button
							className={classes.iconButton}
							title="Attach file"
							aria-label="Attach file"
						>
							<AttachRegular fontSize={20} />
						</button>
					</div>
					<div className={classes.rightTools}>
						<VoiceInput
							onStartRecording={voice.handleStart}
							onTranscriptChange={voice.handleTranscript}
							onStopRecording={voice.handleStop}
						/>
						{isPromptProcessing ? (
							<button
								className={mergeClasses(classes.sendButton, classes.stopButton)}
								onClick={onCancelMessage}
								title="Stop generating"
								aria-label="Stop generating"
							>
								<Stop16Filled />
							</button>
						) : (
							<button
								className={mergeClasses(
									classes.sendButton,
									hasInput && classes.sendButtonActive,
								)}
								onClick={handleSend}
								disabled={!hasInput}
								title="Send message"
								aria-label="Send message"
							>
								<SendRegular fontSize={20} />
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
