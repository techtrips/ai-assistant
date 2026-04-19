import { Button, Input, mergeClasses } from "@fluentui/react-components";
import { useMemo, useState } from "react";
import {
	Add16Regular,
	Add24Regular,
	Search20Regular,
} from "@fluentui/react-icons";
import {
	ConversationHistoryDisplayLocation,
	IConversationHistoryPageProps,
} from "./ConversationHistoryPage.models";
import { useConversationHistoryPageStyles } from "./ConversationHistoryPage.styles";
import { getTimeAgo } from "../AIAssistantChat.utils";
import type { IAIAssistantConversation } from "../../AIAssistant.models";
import { PageLayout } from "../../../common/page-layout";

export const ConversationHistoryPage = (
	props: IConversationHistoryPageProps,
) => {
	const {
		conversations,
		displayLocation,
		onClose,
		onNewChat,
		searchQuery,
		onSearchChange,
		onSelectConversation,
	} = props;
	const classes = useConversationHistoryPageStyles();
	const [internalSearchQuery, setInternalSearchQuery] = useState("");
	const isSidebar =
		displayLocation === ConversationHistoryDisplayLocation.Sidebar;
	const effectiveSearchQuery = searchQuery ?? internalSearchQuery;

	const allConversations = conversations?.data ?? [];
	const filtered = allConversations.filter((c) =>
		c.firstMessageText
			.toLowerCase()
			.includes(effectiveSearchQuery.toLowerCase()),
	);

	const mergedStyles = useMemo(() => {
		const merge = (key: keyof typeof classes) =>
			mergeClasses(
				classes[key],
				isSidebar && classes[`${key}Sidebar` as keyof typeof classes],
			);

		return {
			newChatButton: merge("newChatButton"),
			searchInput: merge("searchInput"),
			countText: merge("countText"),
			list: merge("list"),
			card: merge("card"),
			cardTitle: merge("cardTitle"),
			cardTime: merge("cardTime"),
			cardDescription: merge("cardDescription"),
		};
	}, [classes, isSidebar]);

	const handleSearchValueChange = (value: string) => {
		if (onSearchChange) {
			onSearchChange(value);
			return;
		}

		setInternalSearchQuery(value);
	};

	/* ── Render helpers ──────────────────────────────────────────────── */

	const renderConversationRow = (conversation: IAIAssistantConversation) => (
		<button
			key={conversation.id}
			className={mergedStyles.card}
			type="button"
			onClick={() => onSelectConversation(conversation)}
		>
			<div className={classes.cardContent}>
				<div className={classes.cardTitleRow}>
					<span className={mergedStyles.cardTitle}>
						{conversation.firstMessageText}
					</span>
					<span className={mergedStyles.cardTime}>
						{getTimeAgo(conversation.lastActivityAt)}
					</span>
				</div>
				{!isSidebar && (
					<div className={mergedStyles.cardDescription}>
						Last message {getTimeAgo(conversation.lastActivityAt)}
					</div>
				)}
			</div>
		</button>
	);

	const renderHeaderActions = () =>
		onNewChat ? (
			<Button
				appearance="primary"
				className={mergedStyles.newChatButton}
				size={isSidebar ? "small" : "medium"}
				icon={isSidebar ? <Add16Regular /> : <Add24Regular fontSize={20} />}
				onClick={onNewChat}
			>
				New Chat
			</Button>
		) : null;

	const renderToolbarContent = () => (
		<>
			{allConversations.length > 0 && (
				<Input
					className={mergedStyles.searchInput}
					size={isSidebar ? "small" : "medium"}
					contentBefore={<Search20Regular fontSize={isSidebar ? 16 : 20} />}
					input={{ className: classes.searchInputField }}
					placeholder={isSidebar ? "Search" : "Search conversations"}
					value={effectiveSearchQuery}
					onChange={(_, data) => handleSearchValueChange(data.value)}
				/>
			)}
			<span className={mergedStyles.countText}>
				{filtered.length} conversation
				{filtered.length === 1 ? "" : "s"}
			</span>
		</>
	);

	/* ── Render ──────────────────────────────────────────────────────── */

	return (
		<PageLayout
			title="Chats"
			isSidebar={isSidebar}
			headerActions={renderHeaderActions()}
			toolbar={renderToolbarContent()}
			onClose={onClose}
		>
			<div className={mergedStyles.list}>
				{filtered.map(renderConversationRow)}
			</div>
		</PageLayout>
	);
};
