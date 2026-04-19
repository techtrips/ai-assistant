import { Search12Regular } from "@fluentui/react-icons";
import { useSidebarChatHistoryStyles } from "./SidebarChatHistory.styles";
import {
	useConversationHistory,
	getTimeAgo,
} from "../extensions/conversation-history";

export const SidebarChatHistory = ({ onSelect }: { onSelect: () => void }) => {
	const classes = useSidebarChatHistoryStyles();
	const {
		service,
		filtered,
		loading,
		searchQuery,
		setSearchQuery,
		handleSelect,
	} = useConversationHistory();

	if (!service) return null;

	return (
		<div className={classes.section}>
			<div className={classes.header}>
				<span className={classes.title}>Recent</span>
			</div>
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
					filtered.map((c) => (
						<button
							key={c.id}
							className={classes.item}
							type="button"
							title={`${c.firstMessageText} · ${getTimeAgo(c.lastActivityAt)}`}
							onClick={() => handleSelect(c, onSelect)}
						>
							{c.firstMessageText}
						</button>
					))
				)}
			</div>
		</div>
	);
};
