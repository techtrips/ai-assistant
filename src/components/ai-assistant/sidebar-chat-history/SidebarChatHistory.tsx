import { mergeClasses } from "@fluentui/react-components";
import { Search12Regular } from "@fluentui/react-icons";
import { useSidebarChatHistoryStyles } from "./SidebarChatHistory.styles";
import {
	useConversationHistory,
	getTimeAgo,
	groupByTime,
} from "../extensions/conversation-history";

export const SidebarChatHistory = ({ onSelect, showSelection }: { onSelect: () => void; showSelection: boolean }) => {
	const classes = useSidebarChatHistoryStyles();
	const {
		service,
		filtered,
		loading,
		searchQuery,
		setSearchQuery,
		handleSelect,
		activeThreadId,
	} = useConversationHistory();

	if (!service) return null;

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
				{loading ? (
					<div className={classes.empty}>Loading…</div>
				) : filtered.length === 0 ? (
					<div className={classes.empty}>
						{searchQuery ? "No matches" : "No conversations yet"}
					</div>
				) : (
					groupByTime(filtered, (c) => c.lastActivityAt).map((group) => (
						<div key={group.label} className={classes.group}>
							<div className={classes.groupLabel}>{group.label}</div>
							{group.items.map((c) => {
								const isActive = showSelection && c.threadId === activeThreadId;
								return (
									<button
										key={c.id}
										className={mergeClasses(classes.item, isActive && classes.itemActive)}
										type="button"
										title={`${c.firstMessageText} · ${getTimeAgo(c.lastActivityAt)}`}
										onClick={() => handleSelect(c, onSelect)}
									>
										<span className={classes.itemText}>{c.firstMessageText}</span>
										<span className={classes.itemTime}>{getTimeAgo(c.lastActivityAt)}</span>
									</button>
								);
							})}
						</div>
					))
				)}
			</div>
		</div>
	);
};
