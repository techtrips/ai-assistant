import type { ReactNode } from "react";
import type { IChatMessage } from "../../AIAssistant.types";

export interface IChatMessageBubbleProps {
	message: IChatMessage;
	renderMessage?: (message: IChatMessage) => ReactNode;
}
