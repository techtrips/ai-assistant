import { mergeClasses } from "@fluentui/react-components";
import {
	AttachRegular,
	SendRegular,
	Stop16Filled,
} from "@fluentui/react-icons";
import { VoiceInput } from "./voice-input";
import { useChatInputStyles } from "./ChatInput.styles";
import { useChatInput } from "./useChatInput";
import type { IChatInputProps } from "./ChatInput.types";

export const ChatInput = ({
	isStreaming,
	onSend,
	onAbort,
	onFileSelect,
	starterPrompts,
}: IChatInputProps) => {
	const classes = useChatInputStyles();
	const {
		value,
		setValue,
		hasInput,
		textareaRef,
		fileInputRef,
		voiceRef,
		handleSend,
		handleKeyDown,
		handleAttachClick,
		handleFileChange,
		handleVoiceStart,
		handleVoiceTranscript,
		handleVoiceStop,
		showSuggestions,
		filteredSuggestions,
		selectedSuggestionIndex,
		setSelectedSuggestionIndex,
		handleSelectSuggestion,
		handleFocus,
		handleBlur,
	} = useChatInput(isStreaming, onSend, starterPrompts);

	return (
		<div className={classes.composerContainer}>
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
					className={classes.composerInput}
					placeholder="Ask anything"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={handleFocus}
					onBlur={handleBlur}
					rows={1}
				/>
				<div className={classes.composerFooter}>
					<div className={classes.leftTools}>
						<button
							className={classes.iconButton}
							type="button"
							title="Attach file"
							aria-label="Attach file"
							onClick={handleAttachClick}
						>
							<AttachRegular fontSize={20} />
						</button>
						<input
							ref={fileInputRef}
							type="file"
							style={{ display: "none" }}
							onChange={(e) => handleFileChange(e, onFileSelect)}
						/>
					</div>
					<div className={classes.rightTools}>
						<VoiceInput
							ref={voiceRef}
							onStartRecording={handleVoiceStart}
							onTranscriptChange={handleVoiceTranscript}
							onStopRecording={handleVoiceStop}
						/>
						{isStreaming ? (
							<button
								className={mergeClasses(
									classes.sendButton,
									classes.sendButtonActive,
								)}
								onClick={onAbort}
								title="Stop generating"
								aria-label="Stop generating"
								type="button"
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
								type="button"
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
