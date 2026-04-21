import { useCallback, useEffect, useRef, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IConversation } from "../../AIAssistant.types";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

export const useConversationHistory = () => {
	const { service, newChat, selectConversation, threadId } =
		useAIAssistantContext();
	const [conversations, setConversations] = useState<IConversation[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState("");

	const pageRef = useRef(1);
	const loadingMoreRef = useRef(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const fetchPage = useCallback(
		async (page: number, search: string, append: boolean) => {
			if (!service) return;
			try {
				const result = await service.getConversationHistory(
					page,
					PAGE_SIZE,
					search || undefined,
				);
				if (result.data) {
					const items = result.data.conversations;
					setConversations((prev) => (append ? [...prev, ...items] : items));
					setTotalCount(result.data.totalCount);
					pageRef.current = page;
				}
				if (result.error) setError(result.error);
			} catch {
				/* ignore */
			}
		},
		[service],
	);

	// Initial load + search changes (debounced)
	useEffect(() => {
		if (!service) {
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(undefined);

		clearTimeout(debounceRef.current);
		const isSearch = searchQuery.length > 0;

		const load = () => {
			fetchPage(1, searchQuery, false).finally(() => setLoading(false));
		};

		if (isSearch) {
			debounceRef.current = setTimeout(load, DEBOUNCE_MS);
		} else {
			load();
		}

		return () => clearTimeout(debounceRef.current);
	}, [service, searchQuery, fetchPage]);

	const loadMore = useCallback(() => {
		if (loadingMoreRef.current || conversations.length >= totalCount) return;
		loadingMoreRef.current = true;
		fetchPage(pageRef.current + 1, searchQuery, true).finally(() => {
			loadingMoreRef.current = false;
		});
	}, [conversations.length, totalCount, searchQuery, fetchPage]);

	const handleSelect = useCallback(
		async (conversation: IConversation, onClose: () => void) => {
			if (!service) return;
			onClose();
			await selectConversation(conversation.threadId);
		},
		[service, selectConversation],
	);

	const handleNewChat = useCallback(
		(onClose: () => void) => {
			newChat();
			onClose();
		},
		[newChat],
	);

	return {
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
		activeThreadId: threadId,
	};
};
