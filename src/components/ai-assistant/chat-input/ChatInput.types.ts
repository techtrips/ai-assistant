import type { IStarterPrompt } from "../AIAssistant.types";

export interface IChatInputProps {
	isStreaming: boolean;
	onSend: (text: string) => void;
	onAbort: () => void;
	onFileSelect?: (file: File) => void;
	starterPrompts?: IStarterPrompt[];
}
