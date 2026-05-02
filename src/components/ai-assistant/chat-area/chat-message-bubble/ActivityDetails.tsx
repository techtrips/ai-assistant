import { Button, Tooltip, mergeClasses } from "@fluentui/react-components";
import {
	ArrowDownloadRegular,
	BrainCircuitRegular,
	CheckmarkCircleFilled,
	CheckmarkRegular,
	CopyRegular,
	EditRegular,
	type FluentIcon,
	FlashRegular,
	PersonRegular,
	PlayRegular,
	SearchRegular,
	WrenchRegular,
} from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import type { IActivityEvent } from "../../AIAssistant.types";
import { useChatMessageBubbleStyles } from "./ChatMessageBubble.styles";
import { formatTime } from "./ChatMessageBubble.utils";

export interface IActivityDetailsProps {
	activities: IActivityEvent[];
	/**
	 * When provided, the panel renders in "live" mode: open by default,
	 * with the label shown next to a small spinner in the summary.
	 */
	progressLabel?: string;
	/**
	 * When true, drops the avatar-aligned left margin so the chip can sit
	 * directly next to the avatar inside the assistant preamble row.
	 */
	inline?: boolean;
}

const iconForActivity = (activity: IActivityEvent): FluentIcon => {
	const key = activity.key.toLowerCase();
	const label = activity.label.toLowerCase();
	if (key.startsWith("tool-done:") || key.startsWith("step-done:"))
		return CheckmarkRegular;
	if (key.startsWith("tool-result:")) return ArrowDownloadRegular;
	if (key.startsWith("tool:") || key.startsWith("step:")) return WrenchRegular;
	if (key.startsWith("activity:")) return FlashRegular;
	if (key.startsWith("reasoning")) return BrainCircuitRegular;
	if (key === "compose") return EditRegular;
	if (key === "run-done") return CheckmarkRegular;
	if (key === "run") return PlayRegular;
	if (label.startsWith("search") || label.startsWith("searching"))
		return SearchRegular;
	if (label.startsWith("delegating")) return PersonRegular;
	if (label.startsWith("getting") || label.startsWith("fetching"))
		return ArrowDownloadRegular;
	return FlashRegular;
};

const formatDuration = (ms: number): string => {
	if (ms < 1000) return `${ms}ms`;
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
	const m = Math.floor(s / 60);
	return `${m}m ${Math.round(s - m * 60)}s`;
};

interface ICopyDetailButtonProps {
	text: string;
	className?: string;
}

const CopyDetailButton = ({ text, className }: ICopyDetailButtonProps) => {
	const [copied, setCopied] = useState(false);
	const label = copied ? "Copied" : "Copy";
	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const finish = () => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		};
		if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(text).then(finish, finish);
		} else {
			finish();
		}
	};
	return (
		<Tooltip content={label} relationship="label" withArrow>
			<Button
				appearance="subtle"
				size="small"
				icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
				onClick={handleClick}
				className={className}
				aria-label={label}
			/>
		</Tooltip>
	);
};

export const ActivityDetails = ({
	activities,
	progressLabel,
	inline,
}: IActivityDetailsProps) => {
	const classes = useChatMessageBubbleStyles();
	const isLive = Boolean(progressLabel);
	const startMs = activities[0]
		? new Date(activities[0].timestamp).getTime()
		: 0;
	// Tick every 500ms while live so the active row's elapsed time keeps
	// growing even when the agent is silent (e.g. waiting on the model to
	// start composing the reply).
	const [nowMs, setNowMs] = useState<number>(() => Date.now());
	useEffect(() => {
		if (!isLive) return;
		const id = window.setInterval(() => setNowMs(Date.now()), 500);
		return () => window.clearInterval(id);
	}, [isLive]);

	// Snapshot the elapsed value of each row at the moment it stopped
	// being the active row, so the displayed time matches what the user
	// last saw ticking instead of jumping to a (potentially skewed)
	// next-event timestamp.
	const frozenElapsedRef = useRef<Map<string, number>>(new Map());
	const prevActiveKeyRef = useRef<string | null>(null);
	const activeKey =
		isLive && activities.length > 0
			? `${activities[activities.length - 1].key}:${activities.length - 1}`
			: null;
	if (prevActiveKeyRef.current && prevActiveKeyRef.current !== activeKey) {
		if (!frozenElapsedRef.current.has(prevActiveKeyRef.current)) {
			frozenElapsedRef.current.set(
				prevActiveKeyRef.current,
				Math.max(0, Date.now() - startMs),
			);
		}
	}
	prevActiveKeyRef.current = activeKey;

	// Track which per-row `<details>` have been opened so we can defer
	// rendering their `<pre>` payload (often several KB of JSON) into
	// the DOM until the user actually expands the row. Once opened we
	// keep the row in the set so React doesn't tear it down on collapse.
	const [expandedRows, setExpandedRows] = useState<Set<string>>(
		() => new Set(),
	);
	const handleRowToggle =
		(key: string) => (e: React.SyntheticEvent<HTMLDetailsElement>) => {
			if (e.currentTarget.open && !expandedRows.has(key)) {
				setExpandedRows((prev) => {
					const next = new Set(prev);
					next.add(key);
					return next;
				});
			}
		};

	return (
		<details
			className={mergeClasses(
				classes.activityDetails,
				inline && classes.activityDetailsInline,
			)}
			open={isLive ? true : undefined}
		>
			<summary
				className={mergeClasses(
					classes.activitySummary,
					isLive && classes.activitySummaryLive,
				)}
			>
				{isLive ? (
					<>
						<span className={classes.activitySpinner} aria-hidden />
						<span className={classes.activitySummaryText}>{progressLabel}</span>
					</>
				) : (
					<>
						<CheckmarkCircleFilled
							className={classes.activityDoneIcon}
							aria-hidden
						/>
						<span className={classes.activitySummaryText}>
							{`Activity · ${activities.length} ${activities.length === 1 ? "step" : "steps"}`}
						</span>
					</>
				)}
				{isLive && activities.length > 0 && (
					<span className={classes.activityCount}>{activities.length}</span>
				)}
			</summary>
			{activities.length > 0 && (
				<div className={classes.activityList}>
					{activities.map((a, idx) => {
						const isLast = idx === activities.length - 1;
						const isActive = isLive && isLast;
						const Icon = iconForActivity(a);
						const eventMs = new Date(a.timestamp).getTime();
						const rowKey = `${a.key}:${idx}`;
						const frozen = frozenElapsedRef.current.get(rowKey);
						// Active row keeps ticking against `now`. Once a row has
						// transitioned to resolved we use the value frozen at
						// transition time (matches what the user just saw); rows
						// that were never active fall back to their event timestamp.
						const elapsed = isActive
							? Math.max(0, nowMs - startMs)
							: (frozen ?? eventMs - startMs);
						const hasDetail = !!a.detail;
						const isRowOpen = expandedRows.has(rowKey);
						return (
							<details
								key={`${a.key}-${idx}`}
								className={mergeClasses(
									classes.activityItemWrap,
									!hasDetail && classes.activityItemWrapStatic,
								)}
								onToggle={hasDetail ? handleRowToggle(rowKey) : undefined}
							>
								<summary
									className={mergeClasses(
										classes.activityItem,
										isActive && classes.activityItemRunning,
										hasDetail && classes.activityItemInteractive,
									)}
								>
									<span
										className={mergeClasses(
											classes.activityItemIconWrap,
											isActive && classes.activityItemIconWrapActive,
										)}
										aria-hidden
									>
										<Icon className={classes.activityItemIcon} />
									</span>
									<span className={classes.activityItemLabel}>{a.label}</span>
									<span className={classes.activityItemTime}>
										{idx === 0
											? formatTime(a.timestamp)
											: `+${formatDuration(elapsed)}`}
									</span>
								</summary>
								{hasDetail && isRowOpen && (
									<div className={classes.activityItemDetailWrap}>
										<CopyDetailButton
											text={a.detail ?? ""}
											className={classes.activityItemCopyButton}
										/>
										<pre className={classes.activityItemDetail}>{a.detail}</pre>
									</div>
								)}
							</details>
						);
					})}
				</div>
			)}
		</details>
	);
};
