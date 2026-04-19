import type { FluentIcon } from "@fluentui/react-icons";
import { AssistantChatNavItem } from "../AIAssistantChat.models";
import {
	AIAssistantFeature,
	IAIAssistantConversation,
} from "../../AIAssistant.models";

export interface INavItem {
	key: AssistantChatNavItem;
	label: string;
	icon: FluentIcon;
	feature?: AIAssistantFeature;
}

export interface IChatNavBarProps {
	activeNavItem: AssistantChatNavItem;
	isCollapsed: boolean;
	conversations?: IAIAssistantConversation[];
	searchQuery: string;
	features?: AIAssistantFeature[];
	onNavSelect: (navItem: AssistantChatNavItem) => void;
	onToggleCollapse: () => void;
	onSearchChange: (query: string) => void;
	onConversationSelect: (conversation: IAIAssistantConversation) => void;
}
