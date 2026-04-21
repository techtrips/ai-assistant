import { useEffect, useRef } from "react";
import {
	Add16Regular,
	ChatRegular,
	Search20Regular,
} from "@fluentui/react-icons";
import { mergeClasses } from "@fluentui/react-components";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { Shimmer } from "../../../common/shimmer";
import { useConversationHistoryStyles } from "./ConversationHistory.styles";
import { useConversationHistory } from "./useConversationHistory";
import { getTimeAgo, groupByTime } from "./ConversationHistory.utils";

const ConversationHistoryPanel = ({ onClose }: IExtensionProps) => {
	const classes = useConversationHistoryStyles();
	const {
		service,
		conversations,
		totalCount,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		loadMore,
		handleSelect,
		handleNewChat,
		activeThreadId,
	} = useConversationHistory();
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef(loadMore);
	loadMoreRef.current = loadMore;

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) loadMoreRef.current();
			},
			{ threshold: 0 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [conversations.length]);

	if (!service) {
		return (
			<PageLayout title="Chats" onClose={onClose}>
				<div className={classes.noService}>Service not configured</div>
			</PageLayout>
		);
	}

	const hasMore = conversations.length < totalCount;

	const renderToolbar = () => (
		<>
			<div className={classes.searchWrap}>
				<Search20Regular fontSize={16} className={classes.searchIcon} />
				<input
					className={classes.searchInput}
					placeholder="Search"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
			<span className={classes.countText}>
				{totalCount} conversation
				{totalCount === 1 ? "" : "s"}
			</span>
		</>
	);

	const renderContent = () => {
		if (loading && conversations.length === 0) {
			return <Shimmer layout="list" rows={5} />;
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
					<div className={classes.emptyTitle}>
						{searchQuery ? "No matches" : "No conversations yet"}
					</div>
					<div className={classes.emptyDescription}>
						{searchQuery
							? "Try a different keyword."
							: "Start a new conversation to see it listed here."}
					</div>
				</div>
			);
		}
		return (
			<div className={classes.list}>
				{groupByTime(conversations, (c) => c.lastActivityAt).map((group) => (
					<div key={group.label} className={classes.group}>
						<div className={classes.groupLabel}>{group.label}</div>
						{group.items.map((c) => {
							const isActive = c.threadId === activeThreadId;
							return (
								<button
									key={c.id}
									className={mergeClasses(
										classes.card,
										isActive && classes.cardActive,
									)}
									type="button"
									onClick={() => handleSelect(c, onClose)}
								>
									<div className={classes.cardRow}>
										<span className={classes.cardTitle}>
											{c.firstMessageText}
										</span>
										<span className={classes.cardTime}>
											{getTimeAgo(c.lastActivityAt)}
										</span>
									</div>
								</button>
							);
						})}
					</div>
				))}
				{hasMore && (
					<div ref={sentinelRef}>
						<Shimmer layout="list" rows={2} />
					</div>
				)}
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
