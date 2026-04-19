import { useCallback, useEffect, useMemo, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IConversation } from "../../AIAssistant.types";
import type { IEntity } from "../../AIAssistant.services";

/** Module-level dedup: one in-flight request at a time. */
let inflightConversations: Promise<IEntity<IConversation[]>> | null = null;

export const useConversationHistory = () => {
	const { service, newChat, setMessages, setThreadId } =
		useAIAssistantContext();
	const [conversations, setConversations] = useState<IConversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (!service) {
			setLoading(false);
			return;
		}
		let ignore = false;

		if (!inflightConversations) {
			inflightConversations = service.getConversationHistory();
			inflightConversations.finally(() => {
				inflightConversations = null;
			});
		}

		inflightConversations.then((result) => {
			if (ignore) return;
			if (result.data) {
				const sorted = [...result.data].sort(
					(a, b) =>
						new Date(b.lastActivityAt).getTime() -
						new Date(a.lastActivityAt).getTime(),
				);
				setConversations(sorted);
			}
			if (result.error) setError(result.error);
			setLoading(false);
		});
		return () => {
			ignore = true;
		};
	}, [service]);

	const filtered = useMemo(() => {
		if (!searchQuery.trim()) return conversations;
		const q = searchQuery.toLowerCase();
		return conversations.filter((c) =>
			c.firstMessageText.toLowerCase().includes(q),
		);
	}, [conversations, searchQuery]);

	const handleSelect = useCallback(
		async (conversation: IConversation, onClose: () => void) => {
			if (!service) return;
			setThreadId(conversation.threadId);
			setMessages([]);
			onClose();
			const result = await service.getConversationMessages(
				conversation.threadId,
			);
			if (result.data) {
				setMessages(result.data);
			}
		},
		[service, setMessages, setThreadId],
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
		filtered,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		handleSelect,
		handleNewChat,
	};
};
