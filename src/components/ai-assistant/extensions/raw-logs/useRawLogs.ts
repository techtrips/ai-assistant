import { useCallback, useEffect, useRef, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IThreadEvent, IThreadTurn } from "../../AIAssistant.services";

export interface IUseRawLogsResult {
	supported: boolean;
	threadId: string;
	events: IThreadEvent[];
	turns: IThreadTurn[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	totalCount: number;
	error?: string;
	refresh: () => void;
	loadOlder: () => void;
}

const PAGE_SIZE = 50;

/**
 * Loads the raw activity log for the active thread with infinite-scroll
 * pagination. Page 1 returns the most recent `PAGE_SIZE` events; calling
 * `loadOlder()` prepends the previous batch. Requires the host service
 * to implement `getThreadEvents`; otherwise reports unsupported.
 */
export const useRawLogs = (): IUseRawLogsResult => {
	const { service, threadId } = useAIAssistantContext();
	const [events, setEvents] = useState<IThreadEvent[]>([]);
	const [turns, setTurns] = useState<IThreadTurn[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [totalCount, setTotalCount] = useState(0);
	const [error, setError] = useState<string | undefined>();
	const reqIdRef = useRef(0);
	const pageRef = useRef(1);
	const loadingMoreRef = useRef(false);

	const supported = !!service?.getThreadEvents;

	const fetchTurns = useCallback(async () => {
		if (!service?.getThreadTurns || !threadId) {
			setTurns([]);
			return;
		}
		try {
			const result = await service.getThreadTurns(threadId);
			if (result.data?.turns) setTurns(result.data.turns);
		} catch {
			// non-fatal — dropdown just falls back to deriving turns from events
		}
	}, [service, threadId]);

	const fetchInitial = useCallback(async () => {
		if (!service?.getThreadEvents || !threadId) {
			setEvents([]);
			setTotalCount(0);
			pageRef.current = 1;
			return;
		}
		const reqId = ++reqIdRef.current;
		setLoading(true);
		setError(undefined);
		try {
			const [result] = await Promise.all([
				service.getThreadEvents(threadId, 1, PAGE_SIZE),
				fetchTurns(),
			]);
			if (reqId !== reqIdRef.current) return;
			if (result.data) {
				setEvents(result.data.events ?? []);
				setTotalCount(
					result.data.totalCount ?? result.data.events?.length ?? 0,
				);
				pageRef.current = 1;
			}
			if (result.error) setError(result.error);
		} catch (err) {
			if (reqId !== reqIdRef.current) return;
			setError(err instanceof Error ? err.message : "Failed to load events");
		} finally {
			if (reqId === reqIdRef.current) setLoading(false);
		}
	}, [service, threadId, fetchTurns]);

	const loadOlder = useCallback(async () => {
		if (!service?.getThreadEvents || !threadId) return;
		if (loadingMoreRef.current) return;
		if (events.length >= totalCount) return;
		loadingMoreRef.current = true;
		setLoadingMore(true);
		const nextPage = pageRef.current + 1;
		try {
			const result = await service.getThreadEvents(
				threadId,
				nextPage,
				PAGE_SIZE,
			);
			if (result.data) {
				const older = result.data.events ?? [];
				setEvents((prev) => [...older, ...prev]);
				setTotalCount(result.data.totalCount ?? totalCount);
				pageRef.current = nextPage;
			}
		} catch {
			/* ignore — next attempt will retry */
		} finally {
			loadingMoreRef.current = false;
			setLoadingMore(false);
		}
	}, [service, threadId, events.length, totalCount]);

	useEffect(() => {
		fetchInitial();
	}, [fetchInitial]);

	return {
		supported,
		threadId,
		events,
		turns,
		loading,
		loadingMore,
		hasMore: events.length < totalCount,
		totalCount,
		error,
		refresh: fetchInitial,
		loadOlder,
	};
};
