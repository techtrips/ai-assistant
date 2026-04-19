import { useState, useMemo, useCallback, useEffect } from "react";
import {
	makeStyles,
	mergeClasses,
	Button as FluentButton,
	Input,
	Table as FluentTable,
	TableHeader,
	TableRow,
	TableHeaderCell,
	TableBody,
	TableCell,
	TableCellLayout,
} from "@fluentui/react-components";
import {
	ArrowSortDown20Filled,
	ArrowSortUp20Filled,
	Search20Regular,
	Dismiss20Regular,
} from "@fluentui/react-icons";
import { tableStyles } from "./Table.styles";
import type {
	ITableControl,
	IControlProps,
	ControlValue,
} from "../../templates.models";
import { formatValue, toReactStyle, toTextStyle } from "../common.utils";
import {
	compareCells,
	resolveActionTemplate,
	matchesSummaryTile,
} from "./Table.utils";
import type { SortState, RowEntry, ResolvedSummaryTile } from "./Table.utils";
import { TableSummaryTiles } from "./TableSummaryTiles";

const useStyles = makeStyles(tableStyles);

export interface ITableProps extends ITableControl, IControlProps {}

export const Table = (props: ITableProps) => {
	const {
		rows,
		rawRows,
		columns,
		label,
		onRowClickPrompt,
		onAction,
		style,
		sortable = true,
		searchable = true,
		searchPlaceholder = "Search across all columns...",
		showRecordCount = false,
		summaryTiles,
	} = props;
	const classes = useStyles();

	const [sort, setSort] = useState<SortState>(null);
	const [search, setSearch] = useState("");
	const [activeSummaryTileId, setActiveSummaryTileId] = useState<string | null>(
		null,
	);

	const handleRowClick = onRowClickPrompt
		? (row: Record<string, unknown>) => {
				const mergedData = { ...props.serverData, ...row };
				const resolved = resolveActionTemplate(onRowClickPrompt, mergedData);
				onAction?.(onRowClickPrompt, {
					prompt: resolved,
					data: mergedData,
				});
			}
		: undefined;

	const handleHeaderClick = useCallback(
		(colKey: string, colSortable?: boolean) => {
			if (!sortable) return;
			if (colSortable === false) return;
			setSort((prev) => {
				if (prev?.key === colKey) {
					return prev.dir === "asc" ? { key: colKey, dir: "desc" } : null;
				}
				return { key: colKey, dir: "asc" };
			});
		},
		[sortable],
	);

	const baseRows = useMemo(() => {
		return (rows ?? []).map((r, i) => ({
			row: r,
			raw: rawRows?.[i] ?? (r as unknown as Record<string, unknown>),
		}));
	}, [rows, rawRows]);

	const resolvedSummaryTiles = useMemo<ResolvedSummaryTile[]>(() => {
		return (summaryTiles ?? []).map((tile, idx) => ({
			...tile,
			id: tile.id ?? `summary-tile-${idx}`,
			count: baseRows.filter((entry) => matchesSummaryTile(entry, tile)).length,
		}));
	}, [summaryTiles, baseRows]);

	useEffect(() => {
		if (
			activeSummaryTileId &&
			!resolvedSummaryTiles.some((tile) => tile.id === activeSummaryTileId)
		) {
			setActiveSummaryTileId(null);
		}
	}, [resolvedSummaryTiles, activeSummaryTileId]);

	const handleSummaryTileToggle = useCallback((tileId: string) => {
		setActiveSummaryTileId((current) => (current === tileId ? null : tileId));
	}, []);

	const activeSummaryTile = useMemo(
		() =>
			resolvedSummaryTiles.find((tile) => tile.id === activeSummaryTileId) ??
			null,
		[resolvedSummaryTiles, activeSummaryTileId],
	);

	const processedRows = useMemo(() => {
		let result: RowEntry[] = baseRows;

		if (activeSummaryTile && !activeSummaryTile.showAll) {
			result = result.filter((entry) =>
				matchesSummaryTile(entry, activeSummaryTile),
			);
		}

		// Filter by search term across all visible columns
		if (searchable && search) {
			const term = search.toLowerCase();
			result = result.filter((entry) =>
				columns.some((col) => {
					const val = entry.row[col.key];
					return val != null && String(val).toLowerCase().includes(term);
				}),
			);
		}

		// Sort
		if (sortable && sort) {
			result = [...result].sort((a, b) =>
				compareCells(a.row[sort.key], b.row[sort.key], sort.dir),
			);
		}

		return result;
	}, [
		baseRows,
		activeSummaryTile,
		columns,
		searchable,
		search,
		sortable,
		sort,
	]);

	const totalCount = (rows ?? []).length;
	const filteredCount = processedRows.length;
	const recordCountText = search
		? `Showing ${filteredCount} of ${totalCount} records`
		: `Showing ${totalCount} records`;

	return (
		<div className={classes.root} style={toReactStyle(style)}>
			{label && (
				<span className={classes.label} style={toTextStyle(style)}>
					{label}
				</span>
			)}
			<TableSummaryTiles
				tiles={resolvedSummaryTiles}
				activeTileId={activeSummaryTileId}
				onSelectTile={handleSummaryTileToggle}
				classes={{
					summaryTilesRow: classes.summaryTilesRow,
					summaryTiles: classes.summaryTiles,
					summaryTile: classes.summaryTile,
					summaryTileActive: classes.summaryTileActive,
					summaryTileIcon: classes.summaryTileIcon,
					summaryTileText: classes.summaryTileText,
					summaryTileCount: classes.summaryTileCount,
					summaryTileLabel: classes.summaryTileLabel,
				}}
			/>
			<div className={classes.toolbar}>
				{showRecordCount && (
					<div className={classes.recordCount}>{recordCountText}</div>
				)}
				{searchable && (
					<Input
						className={classes.searchBox}
						size="small"
						placeholder={searchPlaceholder}
						contentBefore={<Search20Regular />}
						contentAfter={
							search ? (
								<FluentButton
									appearance="transparent"
									size="small"
									icon={<Dismiss20Regular />}
									onClick={() => setSearch("")}
									aria-label="Clear search"
								/>
							) : undefined
						}
						value={search}
						onChange={(_, d) => setSearch(d.value)}
					/>
				)}
			</div>
			<div className={classes.tableWrapper}>
				<FluentTable size="small">
					<TableHeader>
						<TableRow className={classes.headerRow}>
							{columns.map((col) => {
								const isSortable = sortable && col.sortable !== false;
								const isActive = sort?.key === col.key;
								return (
									<TableHeaderCell
										key={col.key}
										className={mergeClasses(
											classes.headerCell,
											isSortable && classes.sortableHeader,
										)}
										onClick={
											isSortable
												? () => handleHeaderClick(col.key, col.sortable)
												: undefined
										}
										style={
											col.minWidth ? { minWidth: col.minWidth } : undefined
										}
									>
										<TableCellLayout>
											{col.header}
											{isActive && (
												<span className={classes.sortIcon}>
													{sort.dir === "asc" ? (
														<ArrowSortUp20Filled />
													) : (
														<ArrowSortDown20Filled />
													)}
												</span>
											)}
										</TableCellLayout>
									</TableHeaderCell>
								);
							})}
						</TableRow>
					</TableHeader>
					<TableBody>
						{processedRows.length === 0 && (
							<TableRow>
								<TableCell colSpan={columns.length}>
									<div className={classes.emptyMessageRow}>
										No data available
									</div>
								</TableCell>
							</TableRow>
						)}
						{processedRows.map((entry, idx) => (
							<TableRow
								key={idx}
								className={handleRowClick ? classes.clickableRow : undefined}
								onClick={
									handleRowClick ? () => handleRowClick(entry.raw) : undefined
								}
							>
								{columns.map((col) => {
									const rawValue = entry.row[col.key];
									return (
										<TableCell key={col.key}>
											<TableCellLayout>
												{col.format === "button" ? (
													<FluentButton
														size="small"
														appearance="primary"
														className={classes.cellButton}
														onClick={(e) => {
															e.stopPropagation();
															if (col.prompt) {
																const mergedData = {
																	...props.serverData,
																	...entry.raw,
																};
																const resolved = resolveActionTemplate(
																	col.prompt,
																	mergedData,
																);
																onAction?.(col.prompt, {
																	prompt: resolved,
																	data: mergedData,
																});
															}
														}}
													>
														{col.buttonLabel ?? col.header}
													</FluentButton>
												) : (
													formatValue(rawValue as ControlValue, col.format)
												)}
											</TableCellLayout>
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</FluentTable>
			</div>
		</div>
	);
};
