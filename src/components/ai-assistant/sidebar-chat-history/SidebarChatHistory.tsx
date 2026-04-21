import { useEffect, useRef } from "react";
import { mergeClasses } from "@fluentui/react-components";
import { Search12Regular } from "@fluentui/react-icons";
import { useSidebarChatHistoryStyles } from "./SidebarChatHistory.styles";
import { Shimmer } from "../../common/shimmer";
import {
	useConversationHistory,
	getTimeAgo,
	groupByTime,
} from "../extensions/conversation-history";

export const SidebarChatHistory = ({
	onSelect,
	showSelection,
}: {
	onSelect: () => void;
	showSelection: boolean;
}) => {
	const classes = useSidebarChatHistoryStyles();
	const {
		service,
		conversations,
		totalCount,
		loading,
		searchQuery,
		setSearchQuery,
		loadMore,
		handleSelect,
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

	if (!service) return null;

	const hasMore = conversations.length < totalCount;

	return (
		<div className={classes.section}>
			<div className={classes.searchWrap}>
				<Search12Regular className={classes.searchIcon} />
				<input
					className={classes.searchInput}
					placeholder="Search chats"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
			<div className={classes.list}>
				{loading && conversations.length === 0 ? (
					<Shimmer layout="list" rows={3} />
				) : conversations.length === 0 ? (
					<div className={classes.empty}>
						{searchQuery ? "No matches" : "No conversations yet"}
					</div>
				) : (
					<>
						{groupByTime(conversations, (c) => c.lastActivityAt).map(
							(group) => (
								<div key={group.label} className={classes.group}>
									<div className={classes.groupLabel}>{group.label}</div>
									{group.items.map((c) => {
										const isActive =
											showSelection && c.threadId === activeThreadId;
										return (
											<button
												key={c.id}
												className={mergeClasses(
													classes.item,
													isActive && classes.itemActive,
												)}
												type="button"
												title={`${c.firstMessageText} · ${getTimeAgo(c.lastActivityAt)}`}
												onClick={() => handleSelect(c, onSelect)}
											>
												<span className={classes.itemText}>
													{c.firstMessageText}
												</span>
												<span className={classes.itemTime}>
													{getTimeAgo(c.lastActivityAt)}
												</span>
											</button>
										);
									})}
								</div>
							),
						)}
						{hasMore && (
							<div ref={sentinelRef}>
								<Shimmer layout="list" rows={2} />
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};
