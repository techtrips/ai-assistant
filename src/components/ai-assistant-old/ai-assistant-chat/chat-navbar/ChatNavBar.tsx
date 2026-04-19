import { mergeClasses } from "@fluentui/react-components";
import {
	SparkleRegular,
	AddRegular,
	ChatRegular,
	DocumentRegular,
	LightbulbRegular,
	PanelLeftRegular,
	SettingsRegular,
} from "@fluentui/react-icons";
import { IChatNavBarProps, INavItem } from "./ChatNavBar.models";
import { useChatNavBarStyles } from "./ChatNavBar.styles";
import { AssistantChatNavItem } from "../AIAssistantChat.models";
import { AIAssistantFeature, hasFeature } from "../../AIAssistant.models";
import { ConversationHistoryPage } from "../conversation-history-page/ConversationHistoryPage";
import { ConversationHistoryDisplayLocation } from "../conversation-history-page/ConversationHistoryPage.models";

const navItems: INavItem[] = [
	{ key: AssistantChatNavItem.NewChat, label: "New Chat", icon: AddRegular },
	{
		key: AssistantChatNavItem.Chats,
		label: "Chats",
		icon: ChatRegular,
		feature: AIAssistantFeature.ConversationHistory,
	},
	{
		key: AssistantChatNavItem.StarterPrompts,
		label: "Starter Prompts",
		icon: LightbulbRegular,
		feature: AIAssistantFeature.StarterPrompts,
	},
	{
		key: AssistantChatNavItem.Templates,
		label: "Templates",
		icon: DocumentRegular,
		feature: AIAssistantFeature.Templates,
	},
	{
		key: AssistantChatNavItem.Settings,
		label: "Settings",
		icon: SettingsRegular,
		feature: AIAssistantFeature.Settings,
	},
];

export const ChatNavBar = (props: IChatNavBarProps) => {
	const {
		activeNavItem,
		isCollapsed,
		conversations,
		searchQuery,
		features,
		onNavSelect,
		onToggleCollapse,
		onSearchChange,
		onConversationSelect,
	} = props;

	const classes = useChatNavBarStyles();
	const toggleSidebarTooltip = isCollapsed ? "Expand" : "Collapse";
	const visibleNavItems = navItems.filter(
		(item) => !item.feature || hasFeature(features, item.feature),
	);

	return (
		<div
			className={mergeClasses(
				classes.root,
				isCollapsed && classes.rootCollapsed,
			)}
		>
			<div
				className={mergeClasses(
					classes.topActions,
					isCollapsed && classes.topActionsCollapsed,
				)}
			>
				{!isCollapsed && <SparkleRegular fontSize={20} />}
				<button
					className={classes.iconButton}
					type="button"
					title={toggleSidebarTooltip}
					aria-label={toggleSidebarTooltip}
					onClick={onToggleCollapse}
				>
					<PanelLeftRegular fontSize={20} />
				</button>
			</div>

			<div className={classes.navSection}>
				{visibleNavItems.map(({ key, label, icon: Icon }) => (
					<button
						key={key}
						className={mergeClasses(
							classes.navButton,
							activeNavItem === key && classes.navButtonActive,
							isCollapsed && classes.navButtonCollapsed,
						)}
						type="button"
						title={label}
						aria-label={label}
						onClick={() => onNavSelect(key)}
					>
						<Icon fontSize={20} />
						{!isCollapsed && label}
					</button>
				))}
			</div>

			{!isCollapsed && (
				<ConversationHistoryPage
					conversations={{ data: conversations, loading: false }}
					displayLocation={ConversationHistoryDisplayLocation.Sidebar}
					searchQuery={searchQuery}
					onSearchChange={onSearchChange}
					onSelectConversation={onConversationSelect}
				/>
			)}
		</div>
	);
};
