import { useCallback, useRef } from "react";
import { mergeClasses } from "@fluentui/react-components";
import {
	MicRegular,
	DismissRegular,
	CheckmarkRegular,
} from "@fluentui/react-icons";
import { IVoiceInputProps } from "./VoiceInput.models";
import { useVoiceInputStyles } from "./VoiceInput.styles";
import { useSpeechRecognition } from "./useSpeechRecognition";

export const VoiceInput = (props: IVoiceInputProps) => {
	const { onStartRecording, onStopRecording, onTranscriptChange } = props;
	const classes = useVoiceInputStyles();
	const transcriptRef = useRef("");

	const handleTranscript = useCallback(
		(transcript: string) => {
			transcriptRef.current = transcript;
			onTranscriptChange?.(transcript);
		},
		[onTranscriptChange],
	);

	const {
		isSupported,
		isListening,
		interimTranscript,
		startListening,
		stopListening,
		abortListening,
	} = useSpeechRecognition(handleTranscript, handleTranscript);

	const handleStart = useCallback(() => {
		if (!isSupported) return;
		transcriptRef.current = "";
		onStartRecording();
		startListening();
	}, [isSupported, onStartRecording, startListening]);

	const handleCancel = useCallback(() => {
		transcriptRef.current = "";
		abortListening();
		onStopRecording("");
	}, [abortListening, onStopRecording]);

	const handleConfirm = useCallback(() => {
		stopListening();
		onStopRecording((transcriptRef.current || interimTranscript).trim());
	}, [stopListening, onStopRecording, interimTranscript]);

	return (
		<div className={classes.root}>
			{isListening && (
				<div className={classes.listeningIndicator}>
					<span className={classes.listeningDot} />
					<span>{interimTranscript || "Listening..."}</span>
				</div>
			)}

			{isListening ? (
				<>
					<button
						className={classes.actionButton}
						type="button"
						title="Cancel voice recording"
						aria-label="Cancel voice recording"
						onClick={handleCancel}
					>
						<DismissRegular fontSize={18} />
					</button>
					<button
						className={mergeClasses(
							classes.actionButton,
							classes.actionButtonConfirm,
						)}
						type="button"
						title="Use recorded text"
						aria-label="Use recorded text"
						onClick={handleConfirm}
					>
						<CheckmarkRegular fontSize={18} />
					</button>
				</>
			) : (
				<button
					className={mergeClasses(
						classes.button,
						!isSupported && classes.buttonRecording,
					)}
					type="button"
					title={
						isSupported
							? "Start voice recording"
							: "Speech recognition is not supported in this browser"
					}
					aria-label="Start voice recording"
					onClick={handleStart}
					disabled={!isSupported}
				>
					<MicRegular fontSize={20} />
				</button>
			)}
		</div>
	);
};
