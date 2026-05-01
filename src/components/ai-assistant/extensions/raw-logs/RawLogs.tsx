import {
	ArrowClockwise16Regular,
	ChevronDown16Regular,
	ChevronRight16Regular,
	History20Regular,
} from "@fluentui/react-icons";
import { mergeClasses } from "@fluentui/react-components";
import { useEffect, useMemo, useRef, useState } from "react";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { Shimmer } from "../../../common/shimmer";
import type { IThreadEvent } from "../../AIAssistant.services";
import { friendlyThreadName } from "../../AIAssistant.utils";
import { useRawLogsStyles } from "./RawLogs.styles";
import { useRawLogs } from "./useRawLogs";

const formatTimestamp = (iso: string): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const date = d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
	const time = d.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
	return `${date} ${time}`;
};

const RawLogsPanel = ({ onClose }: IExtensionProps) => {
	const classes = useRawLogsStyles();
	const {
		supported,
		threadId,
		events,
		turns: serverTurns,
		loading,
		loadingMore,
		hasMore,
		error,
		refresh,
		loadOlder,
	} = useRawLogs();
	const [selectedRunId, setSelectedRunId] = useState<string>("_all");
	const [hideDuplicates, setHideDuplicates] = useState(true);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const toggleExpanded = (id: string) =>
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

	// Prefer server-provided turn list (covers turns whose events haven't
	// been paginated in yet). Fall back to deriving from the loaded
	// events when the host service doesn't expose getThreadTurns.
	const turns = useMemo(() => {
		if (serverTurns.length > 0) {
			return serverTurns.map((t) => ({ runId: t.runId, label: t.label }));
		}
		const seen = new Map<string, { runId: string; label: string }>();
		for (const ev of events) {
			const key = ev.runId ?? "_ungrouped";
			if (seen.has(key)) continue;
			let label = "(no prompt)";
			if (ev.runId) {
				const userEv = events.find(
					(e) => e.runId === ev.runId && e.role === "user",
				);
				if (userEv?.content) {
					label = userEv.content.replace(/\s+/g, " ").trim().slice(0, 60);
					if (userEv.content.length > 60) label += "…";
				}
			} else {
				label = "Earlier activity";
			}
			seen.set(key, { runId: key, label });
		}
		return Array.from(seen.values());
	}, [serverTurns, events]);

	// Default to "All" and keep it selected unless the user picks a turn
	// that no longer exists (e.g. after a thread switch).
	useEffect(() => {
		if (selectedRunId === "_all") return;
		if (turns.length === 0) {
			setSelectedRunId("_all");
			return;
		}
		if (!turns.some((t) => t.runId === selectedRunId)) {
			setSelectedRunId("_all");
		}
	}, [turns, selectedRunId]);

	const visibleEvents = useMemo(() => {
		const base =
			!selectedRunId || selectedRunId === "_all"
				? events
				: events.filter((e) => (e.runId ?? "_ungrouped") === selectedRunId);
		if (!hideDuplicates) return base;
		// Collapse consecutive identical assistant snapshots within a turn
		// (same runId + agent + content). Keeps the last occurrence.
		const out: typeof base = [];
		for (const ev of base) {
			if (ev.role === "assistant" && out.length > 0) {
				const prev = out[out.length - 1];
				if (
					prev.role === "assistant" &&
					prev.runId === ev.runId &&
					prev.agent === ev.agent &&
					prev.content === ev.content
				) {
					out[out.length - 1] = ev;
					continue;
				}
			}
			out.push(ev);
		}
		return out;
	}, [events, selectedRunId, hideDuplicates]);

	// Auto-scroll to bottom on initial load so the newest event is in
	// view (matches chat). On subsequent prepends from "load older" we
	// preserve the user's scroll position instead.
	const listRef = useRef<HTMLDivElement | null>(null);
	const initialScrolledRef = useRef(false);
	const prevScrollHeightRef = useRef(0);
	const eventCountRef = useRef(0);

	useEffect(() => {
		const el = listRef.current;
		if (!el) return;
		const prevCount = eventCountRef.current;
		eventCountRef.current = events.length;

		// Initial render or turn switch: jump to bottom.
		if (!initialScrolledRef.current && events.length > 0) {
			el.scrollTop = el.scrollHeight;
			initialScrolledRef.current = true;
			prevScrollHeightRef.current = el.scrollHeight;
			return;
		}

		// Older events were prepended — keep the visible row anchored by
		// adding the height delta to scrollTop.
		if (events.length > prevCount && prevScrollHeightRef.current > 0) {
			const delta = el.scrollHeight - prevScrollHeightRef.current;
			if (delta > 0) el.scrollTop += delta;
		}
		prevScrollHeightRef.current = el.scrollHeight;
	}, [events.length]);

	// Reset the "first scroll" anchor when switching turns so the next
	// render scrolls to the bottom of the newly-selected turn.
	useEffect(() => {
		initialScrolledRef.current = false;
		prevScrollHeightRef.current = 0;
	}, [selectedRunId]);

	// If the user picks an older turn whose events aren't in the current
	// page window yet, keep loading older pages until at least one event
	// for that runId is loaded (or there are no more pages).
	useEffect(() => {
		if (selectedRunId === "_all") return;
		if (!hasMore || loadingMore) return;
		const found = events.some(
			(e) => (e.runId ?? "_ungrouped") === selectedRunId,
		);
		if (!found) loadOlder();
	}, [selectedRunId, events, hasMore, loadingMore, loadOlder]);

	const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
		if (!hasMore || loadingMore) return;
		if (e.currentTarget.scrollTop <= 24) {
			prevScrollHeightRef.current = e.currentTarget.scrollHeight;
			loadOlder();
		}
	};

	const roleClass = (role: IThreadEvent["role"]): string => {
		switch (role) {
			case "user":
				return classes.roleUser;
			case "assistant":
				return classes.roleAssistant;
			case "tool-call":
				return classes.roleToolCall;
			case "tool-result":
				return classes.roleToolResult;
			case "mcp-call":
				return classes.roleMcpCall;
			case "mcp-result":
				return classes.roleMcpResult;
			case "a2a-call":
				return classes.roleA2aCall;
			case "a2a-result":
				return classes.roleA2aResult;
			default:
				return classes.roleError;
		}
	};

	const roleLabel = (role: IThreadEvent["role"]): string => {
		switch (role) {
			case "tool-call":
				return "Tool";
			case "tool-result":
				return "Result";
			case "mcp-call":
				return "MCP";
			case "mcp-result":
				return "MCP Result";
			case "a2a-call":
				return "A2A";
			case "a2a-result":
				return "A2A Result";
			default:
				return role.charAt(0).toUpperCase() + role.slice(1);
		}
	};

	const renderToolbar = () => (
		<div className={classes.toolbar}>
			{turns.length > 0 ? (
				<select
					className={classes.turnSelect}
					value={selectedRunId}
					onChange={(e) => setSelectedRunId(e.target.value)}
					disabled={loading || !supported || !threadId}
					title="Select turn"
				>
					<option value="_all">All turns</option>
					{turns.map((t, idx) => (
						<option key={t.runId} value={t.runId}>
							{`Turn ${idx + 1}: ${t.label}`}
						</option>
					))}
				</select>
			) : (
				<span className={classes.count}>
					{visibleEvents.length} event{visibleEvents.length === 1 ? "" : "s"}
				</span>
			)}
			{events.length > 0 && (
				<label className={classes.toggle}>
					<input
						type="checkbox"
						checked={hideDuplicates}
						onChange={(e) => setHideDuplicates(e.target.checked)}
					/>
					Hide duplicates
				</label>
			)}
			<button
				type="button"
				className={classes.refreshButton}
				onClick={refresh}
				disabled={loading || !supported || !threadId}
				title="Refresh"
			>
				<ArrowClockwise16Regular fontSize={14} />
				Refresh
			</button>
		</div>
	);

	const renderContent = () => {
		if (!supported) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>Logs not available</div>
					<div className={classes.emptyDescription}>
						The connected service does not expose a thread events endpoint.
					</div>
				</div>
			);
		}
		if (!threadId) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>No active thread</div>
					<div className={classes.emptyDescription}>
						Send a message to start a new conversation, then come back to view
						its activity log.
					</div>
				</div>
			);
		}
		if (loading && events.length === 0) {
			return <Shimmer layout="list" rows={5} />;
		}
		if (error && events.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>Failed to load</div>
					<div className={classes.emptyDescription}>{error}</div>
				</div>
			);
		}
		if (events.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>No activity yet</div>
					<div className={classes.emptyDescription}>
						Events will appear here as the agent processes your turn.
					</div>
				</div>
			);
		}
		return (
			<div ref={listRef} className={classes.list} onScroll={onListScroll}>
				{hasMore && (
					<div className={classes.loadMoreIndicator}>
						{loadingMore
							? "Loading older events…"
							: "Scroll up for older events"}
					</div>
				)}
				{visibleEvents.map((ev) => {
					const isOpen = !!expanded[ev.id];
					return (
						<div key={ev.id} className={classes.row}>
							<button
								type="button"
								className={classes.header}
								onClick={() => toggleExpanded(ev.id)}
								aria-expanded={isOpen}
							>
								<div className={classes.headerLeft}>
									<span className={classes.chevron}>
										{isOpen ? (
											<ChevronDown16Regular fontSize={14} />
										) : (
											<ChevronRight16Regular fontSize={14} />
										)}
									</span>
									<span
										className={mergeClasses(
											classes.roleBadge,
											roleClass(ev.role),
										)}
									>
										{roleLabel(ev.role)}
									</span>
									{ev.agent && (
										<span className={classes.agent}>{ev.agent}</span>
									)}
									{ev.toolName && (
										<span className={classes.tool}>{ev.toolName}</span>
									)}
								</div>
								<span className={classes.timestamp}>
									{formatTimestamp(ev.timestamp)}
								</span>
							</button>
							{isOpen && ev.content && (
								<pre className={classes.content}>{ev.content}</pre>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<PageLayout
			title={(() => {
				const firstUserText =
					serverTurns[0]?.label ??
					events.find((e) => e.role === "user")?.content;
				const chatName = friendlyThreadName(firstUserText);
				if (selectedRunId === "_all") return `${chatName} \u2014 Logs`;
				const idx = turns.findIndex((x) => x.runId === selectedRunId);
				const t = idx >= 0 ? turns[idx] : undefined;
				if (!t) return `${chatName} \u2014 Logs`;
				return `Turn ${idx + 1}: ${t.label}`;
			})()}
			toolbar={renderToolbar()}
			onClose={onClose}
		>
			{renderContent()}
		</PageLayout>
	);
};

export const RawLogs = defineExtension(RawLogsPanel, {
	key: "raw-logs",
	label: "Logs",
	icon: History20Regular,
});
