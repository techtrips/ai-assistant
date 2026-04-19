import {
	Add16Regular,
	ChatRegular,
	Search20Regular,
} from "@fluentui/react-icons";
import { mergeClasses } from "@fluentui/react-components";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { useConversationHistoryStyles } from "./ConversationHistory.styles";
import { useConversationHistory } from "./useConversationHistory";
import { getTimeAgo, groupByTime } from "./ConversationHistory.utils";

const ConversationHistoryPanel = ({ onClose }: IExtensionProps) => {
	const classes = useConversationHistoryStyles();
	const {
		service,
		conversations,
		filtered,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		handleSelect,
		handleNewChat,
		activeThreadId,
	} = useConversationHistory();

	if (!service) {
		return (
			<PageLayout title="Chats" onClose={onClose}>
				<div className={classes.noService}>Service not configured</div>
			</PageLayout>
		);
	}

	const renderToolbar = () => (
		<>
			{conversations.length > 0 && (
				<div className={classes.searchWrap}>
					<Search20Regular fontSize={16} className={classes.searchIcon} />
					<input
						className={classes.searchInput}
						placeholder="Search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			)}
			<span className={classes.countText}>
				{filtered.length} conversation
				{filtered.length === 1 ? "" : "s"}
			</span>
		</>
	);

	const renderContent = () => {
		if (loading) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyDescription}>Loading…</div>
				</div>
			);
		}
		if (error && conversations.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>Failed to load</div>
					<div className={classes.emptyDescription}>{error}</div>
				</div>
			);
		}
		if (conversations.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>No conversations yet</div>
					<div className={classes.emptyDescription}>
						Start a new conversation to see it listed here.
					</div>
				</div>
			);
		}
		if (filtered.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>No matches</div>
					<div className={classes.emptyDescription}>
						Try a different keyword.
					</div>
				</div>
			);
		}
		return (
			<div className={classes.list}>
				{groupByTime(filtered, (c) => c.lastActivityAt).map((group) => (
					<div key={group.label} className={classes.group}>
						<div className={classes.groupLabel}>{group.label}</div>
						{group.items.map((c) => {
							const isActive = c.threadId === activeThreadId;
							return (
								<button
									key={c.id}
									className={mergeClasses(classes.card, isActive && classes.cardActive)}
									type="button"
									onClick={() => handleSelect(c, onClose)}
								>
									<div className={classes.cardRow}>
										<span className={classes.cardTitle}>{c.firstMessageText}</span>
										<span className={classes.cardTime}>
											{getTimeAgo(c.lastActivityAt)}
										</span>
									</div>
								</button>
							);
						})}
					</div>
				))}
			</div>
		);
	};

	return (
		<PageLayout
			title="Chats"
			headerActions={
				<button
					className={classes.newChatButton}
					type="button"
					onClick={() => handleNewChat(onClose)}
				>
					<Add16Regular fontSize={14} />
					New Chat
				</button>
			}
			toolbar={renderToolbar()}
			onClose={onClose}
		>
			{renderContent()}
		</PageLayout>
	);
};

export const ConversationHistory = defineExtension(ConversationHistoryPanel, {
	key: "chats",
	label: "Chats",
	icon: ChatRegular,
});
