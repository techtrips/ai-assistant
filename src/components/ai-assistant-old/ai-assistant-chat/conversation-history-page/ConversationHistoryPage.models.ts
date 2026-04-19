import { IEntity, IAIAssistantConversation } from "../../AIAssistant.models";

export enum ConversationHistoryDisplayLocation {
	Sidebar = "sidebar",
	MainContent = "mainContent",
}

export interface IConversationHistoryPageProps {
	conversations: IEntity<IAIAssistantConversation[]>;
	displayLocation: ConversationHistoryDisplayLocation;
	searchQuery?: string;
	onClose?: () => void;
	onNewChat?: () => void;
	onSearchChange?: (query: string) => void;
	onSelectConversation: (conversation: IAIAssistantConversation) => void;
}
