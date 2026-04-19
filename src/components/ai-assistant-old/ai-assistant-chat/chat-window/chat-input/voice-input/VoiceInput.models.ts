export interface IVoiceInputProps {
	onStartRecording: () => void;
	onStopRecording: (message: string) => void;
	onTranscriptChange?: (message: string) => void;
}
