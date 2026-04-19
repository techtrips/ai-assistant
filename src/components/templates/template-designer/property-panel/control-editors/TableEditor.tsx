import { useMemo, useState } from "react";
import {
	Button,
	Input,
	Dropdown,
	Option,
	Text,
	Switch,
} from "@fluentui/react-components";
import type {
	ITemplateControl,
	ITableControl,
	ITableSummaryTile,
	ControlValue,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import { ActionBindingInput } from "./binding-editor/ActionBindingInput";
import type { EditorClasses } from "../PropertyPanel.models";
import { TABLE_COL_FORMATS } from "../PropertyPanel.models";
import { resolveBinding } from "../../../template-renderer/bindingResolver";
import {
	extractBindingPaths,
	getSummaryTileKey,
	toPrettyFieldLabel,
} from "../../TemplateDesigner.utils";
import { IconPickerDialog } from "../../../common/icons/IconPickerDialog";

export const TableEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
	bindingData,
}: {
	control: ITableControl;
	onUpdate: (id: string, p: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
	bindingData: Record<string, unknown>;
}) => {
	const [manuallyEditedTileLabels, setManuallyEditedTileLabels] = useState<
		Record<string, true>
	>({});
	const [manuallyEditedColumnHeaders, setManuallyEditedColumnHeaders] =
		useState<Record<number, true>>({});

	const updateSummaryTiles = (tiles: ITableSummaryTile[]) => {
		onUpdate(control.id, {
			summaryTiles: tiles.length ? tiles : undefined,
		} as Partial<ITableControl>);
	};

	const columnFieldPaths = useMemo(() => {
		// Try to derive paths from live binding data first
		if (control.binding && bindingData) {
			const resolved = resolveBinding(control.binding, bindingData);
			if (Array.isArray(resolved) && resolved.length > 0) {
				return extractBindingPaths(resolved[0]);
			}
			if (resolved != null && typeof resolved === "object") {
				return extractBindingPaths(resolved);
			}
		}
		// Fall back to column keys so intellisense works without live data
		if (control.columns?.length) {
			return control.columns.map((c) => c.key);
		}
		return [];
	}, [control.binding, control.columns, bindingData]);

	return (
		<>
			<CollapsibleSection title="Data Source" classes={classes}>
				<FieldGroup label="Row Binding" className={classes.field}>
					<BindingEditor
						placeholder="e.g. lineItems"
						bindingPaths={bindingPaths}
						value={control.binding ?? ""}
						onChange={(v) =>
							onUpdate(control.id, {
								binding: v || undefined,
							} as Partial<ITableControl>)
						}
					/>
				</FieldGroup>
				<FieldGroup label="On Row Click Prompt" className={classes.field}>
					<ActionBindingInput
						placeholder="e.g. Show details for {orderId}"
						bindingPaths={columnFieldPaths}
						globalBindingPaths={bindingPaths}
						value={control.onRowClickPrompt ?? ""}
						onChange={(v) =>
							onUpdate(control.id, {
								onRowClickPrompt: v || undefined,
							} as Partial<ITableControl>)
						}
					/>
				</FieldGroup>
			</CollapsibleSection>

			<CollapsibleSection title="Table Options" classes={classes}>
				<div className={classes.row}>
					<FieldGroup label="Show Record Count" className={classes.halfField}>
						<Switch
							checked={control.showRecordCount === true}
							onChange={(_, d) =>
								onUpdate(control.id, {
									showRecordCount: d.checked,
								} as Partial<ITableControl>)
							}
						/>
					</FieldGroup>
					<FieldGroup label="Sortable" className={classes.halfField}>
						<Switch
							checked={control.sortable !== false}
							onChange={(_, d) =>
								onUpdate(control.id, {
									sortable: d.checked,
								} as Partial<ITableControl>)
							}
						/>
					</FieldGroup>
					<FieldGroup label="Searchable" className={classes.field}>
						<Switch
							checked={control.searchable !== false}
							onChange={(_, d) =>
								onUpdate(control.id, {
									searchable: d.checked,
								} as Partial<ITableControl>)
							}
						/>
					</FieldGroup>
				</div>

				{control.searchable !== false && (
					<FieldGroup label="Search Placeholder" className={classes.field}>
						<Input
							size="small"
							placeholder="Search across all columns..."
							value={control.searchPlaceholder ?? ""}
							onChange={(_, d) =>
								onUpdate(control.id, {
									searchPlaceholder: d.value || undefined,
								} as Partial<ITableControl>)
							}
						/>
					</FieldGroup>
				)}
			</CollapsibleSection>

			<CollapsibleSection
				title={`Columns (${control.columns.length})`}
				classes={classes}
			>
				{control.columns.map((col, idx) => (
					<div key={col.key} className={classes.columnCard}>
						<div className={classes.columnHeader}>
							<Text weight="semibold" size={200}>
								#{idx + 1}
							</Text>
							<Button
								appearance="subtle"
								size="small"
								onClick={() => {
									const cols = control.columns.filter((_, i) => i !== idx);
									onUpdate(control.id, {
										columns: cols,
									} as Partial<ITableControl>);
								}}
							>
								Remove
							</Button>
						</div>
						<FieldGroup label="Key" className={classes.field}>
							<Input
								size="small"
								value={col.key}
								onChange={(_, d) => {
									const cols = [...control.columns];
									cols[idx] = { ...cols[idx], key: d.value };
									onUpdate(control.id, {
										columns: cols,
									} as Partial<ITableControl>);
								}}
							/>
						</FieldGroup>
						<FieldGroup label="Header" className={classes.field}>
							<Input
								size="small"
								value={col.header}
								onChange={(_, d) => {
									setManuallyEditedColumnHeaders((prev) => ({
										...prev,
										[idx]: true,
									}));

									const cols = [...control.columns];
									cols[idx] = { ...cols[idx], header: d.value };
									onUpdate(control.id, {
										columns: cols,
									} as Partial<ITableControl>);
								}}
							/>
						</FieldGroup>
						<FieldGroup label="Field Binding" className={classes.field}>
							<BindingEditor
								placeholder="e.g. amount.value"
								bindingPaths={columnFieldPaths}
								value={col.field ?? ""}
								onChange={(v) => {
									const cols = [...control.columns];
									const hasManualHeader =
										manuallyEditedColumnHeaders[idx] === true;
									const currentAutoHeader = toPrettyFieldLabel(
										cols[idx]?.field,
									);
									const nextField = v || undefined;
									const shouldAutoUpdateHeader =
										!hasManualHeader &&
										(!cols[idx].header ||
											cols[idx].header === "New Column" ||
											cols[idx].header === currentAutoHeader);

									cols[idx] = {
										...cols[idx],
										field: nextField,
										header:
											shouldAutoUpdateHeader && nextField
												? toPrettyFieldLabel(nextField)
												: cols[idx].header,
									};
									onUpdate(control.id, {
										columns: cols,
									} as Partial<ITableControl>);
								}}
							/>
						</FieldGroup>
						<FieldGroup label="Format" className={classes.field}>
							<Dropdown
								size="small"
								value={col.format ?? "text"}
								selectedOptions={[col.format ?? "text"]}
								onOptionSelect={(_, d) => {
									const cols = [...control.columns];
									cols[idx] = {
										...cols[idx],
										format: d.optionValue as (typeof TABLE_COL_FORMATS)[number],
									};
									onUpdate(control.id, {
										columns: cols,
									} as Partial<ITableControl>);
								}}
							>
								{TABLE_COL_FORMATS.map((f) => (
									<Option key={f} value={f}>
										{f}
									</Option>
								))}
							</Dropdown>
						</FieldGroup>
						{col.format === "button" && (
							<>
								<FieldGroup label="Action Prompt" className={classes.field}>
									<ActionBindingInput
										placeholder="Enter text with {field}"
										bindingPaths={columnFieldPaths}
										globalBindingPaths={bindingPaths}
										value={col.prompt ?? ""}
										onChange={(v) => {
											const cols = [...control.columns];
											cols[idx] = {
												...cols[idx],
												prompt: v || undefined,
											};
											onUpdate(control.id, {
												columns: cols,
											} as Partial<ITableControl>);
										}}
									/>
								</FieldGroup>
								<FieldGroup label="Button Label" className={classes.field}>
									<Input
										size="small"
										placeholder={col.header || "Action"}
										value={col.buttonLabel ?? ""}
										onChange={(_, d) => {
											const cols = [...control.columns];
											cols[idx] = {
												...cols[idx],
												buttonLabel: d.value || undefined,
											};
											onUpdate(control.id, {
												columns: cols,
											} as Partial<ITableControl>);
										}}
									/>
								</FieldGroup>
							</>
						)}
					</div>
				))}
				<Button
					className={classes.addColumnBtn}
					appearance="outline"
					size="small"
					onClick={() => {
						const cols = [
							...control.columns,
							{ key: `col${control.columns.length + 1}`, header: "New Column" },
						];
						onUpdate(control.id, { columns: cols } as Partial<ITableControl>);
					}}
				>
					+ Add Column
				</Button>
			</CollapsibleSection>

			<CollapsibleSection
				title={`Summary Tiles (${(control.summaryTiles ?? []).length})`}
				classes={classes}
			>
				{(control.summaryTiles ?? []).map((tile, idx) => {
					const resolvedId = tile.id ?? `tile${idx + 1}`;
					const isFilterEnabled = tile.showAll !== true;
					return (
						<div key={`${resolvedId}-${idx}`} className={classes.columnCard}>
							<div className={classes.columnHeader}>
								<Text weight="semibold" size={200}>
									Tile #{idx + 1}
								</Text>
								<Button
									appearance="subtle"
									size="small"
									onClick={() => {
										const tiles = (control.summaryTiles ?? []).filter(
											(_, i) => i !== idx,
										);
										updateSummaryTiles(tiles);
									}}
								>
									Remove
								</Button>
							</div>

							<FieldGroup label="Tile Id" className={classes.field}>
								<Input
									size="small"
									placeholder={`tile${idx + 1}`}
									value={tile.id ?? ""}
									onChange={(_, d) => {
										const oldKey = getSummaryTileKey(tile.id, idx);
										const nextId = d.value || undefined;
										const newKey = getSummaryTileKey(nextId, idx);

										if (oldKey !== newKey && manuallyEditedTileLabels[oldKey]) {
											setManuallyEditedTileLabels((prev) => {
												const next = { ...prev };
												delete next[oldKey];
												next[newKey] = true;
												return next;
											});
										}

										const tiles = [...(control.summaryTiles ?? [])];
										tiles[idx] = {
											...tiles[idx],
											id: nextId,
										};
										updateSummaryTiles(tiles);
									}}
								/>
							</FieldGroup>

							<FieldGroup label="Label" className={classes.field}>
								<Input
									size="small"
									value={tile.label}
									onChange={(_, d) => {
										const key = getSummaryTileKey(tile.id, idx);
										setManuallyEditedTileLabels((prev) => ({
											...prev,
											[key]: true,
										}));

										const tiles = [...(control.summaryTiles ?? [])];
										tiles[idx] = {
											...tiles[idx],
											label: d.value,
										};
										updateSummaryTiles(tiles);
									}}
								/>
							</FieldGroup>

							<FieldGroup label="Icon" className={classes.field}>
								<IconPickerDialog
									value={tile.iconName}
									onChange={(iconName) => {
										const tiles = [...(control.summaryTiles ?? [])];
										tiles[idx] = {
											...tiles[idx],
											iconName,
										};
										updateSummaryTiles(tiles);
									}}
								/>
							</FieldGroup>

							<FieldGroup label="Filter by Field" className={classes.field}>
								<Switch
									checked={isFilterEnabled}
									onChange={(_, d) => {
										const key = getSummaryTileKey(tile.id, idx);
										const hasManualLabel =
											manuallyEditedTileLabels[key] === true;
										const enableFilter = d.checked;

										const tiles = [...(control.summaryTiles ?? [])];
										tiles[idx] = {
											...tiles[idx],
											showAll: !enableFilter,
											label: hasManualLabel
												? tiles[idx].label
												: enableFilter
													? toPrettyFieldLabel(tiles[idx].field)
													: "All",
										};
										updateSummaryTiles(tiles);
									}}
								/>
							</FieldGroup>

							{isFilterEnabled && (
								<>
									<FieldGroup label="Filter Field" className={classes.field}>
										<BindingEditor
											placeholder="e.g. status"
											bindingPaths={columnFieldPaths}
											value={tile.field ?? ""}
											onChange={(v) => {
												const key = getSummaryTileKey(tile.id, idx);
												const hasManualLabel =
													manuallyEditedTileLabels[key] === true;
												const currentAutoLabel = toPrettyFieldLabel(tile.field);
												const shouldAutoUpdateLabel =
													!hasManualLabel &&
													(!tile.label ||
														tile.label === "New Tile" ||
														tile.label === currentAutoLabel);

												const tiles = [...(control.summaryTiles ?? [])];
												tiles[idx] = {
													...tiles[idx],
													field: v || undefined,
													label: shouldAutoUpdateLabel
														? toPrettyFieldLabel(v || undefined)
														: tiles[idx].label,
												};
												updateSummaryTiles(tiles);
											}}
										/>
									</FieldGroup>

									<FieldGroup label="Filter Value" className={classes.field}>
										<Input
											size="small"
											disabled={!tile.field}
											placeholder={
												tile.field ? "e.g. Draft" : "Choose filter field first"
											}
											value={String(tile.value ?? "")}
											onChange={(_, d) => {
												const tiles = [...(control.summaryTiles ?? [])];
												tiles[idx] = {
													...tiles[idx],
													value: d.value,
												};
												updateSummaryTiles(tiles);
											}}
										/>
									</FieldGroup>
								</>
							)}
						</div>
					);
				})}

				<Button
					className={classes.addColumnBtn}
					appearance="outline"
					size="small"
					onClick={() => {
						const tiles = [
							...(control.summaryTiles ?? []),
							{
								id: `tile${(control.summaryTiles ?? []).length + 1}`,
								label: "New Tile",
								showAll: true,
							},
						];
						updateSummaryTiles(tiles);
					}}
				>
					+ Add Summary Tile
				</Button>
			</CollapsibleSection>

			{!control.binding && (
				<CollapsibleSection
					title={`Static Rows (${(control.rows ?? []).length})`}
					classes={classes}
				>
					{(control.rows ?? []).map((row, rowIdx) => (
						<div key={rowIdx} className={classes.columnCard}>
							<div className={classes.columnHeader}>
								<Text weight="semibold" size={200}>
									Row #{rowIdx + 1}
								</Text>
								<Button
									appearance="subtle"
									size="small"
									onClick={() => {
										const rows = (control.rows ?? []).filter(
											(_, i) => i !== rowIdx,
										);
										onUpdate(control.id, {
											rows,
										} as Partial<ITableControl>);
									}}
								>
									Remove
								</Button>
							</div>
							{control.columns.map((col) => (
								<FieldGroup
									key={col.key}
									label={col.header || col.key}
									className={classes.field}
								>
									<Input
										size="small"
										value={String(row[col.key] ?? "")}
										onChange={(_, d) => {
											const rows = [...(control.rows ?? [])];
											rows[rowIdx] = {
												...rows[rowIdx],
												[col.key]: d.value as ControlValue,
											};
											onUpdate(control.id, {
												rows,
											} as Partial<ITableControl>);
										}}
									/>
								</FieldGroup>
							))}
						</div>
					))}
					<Button
						className={classes.addColumnBtn}
						appearance="outline"
						size="small"
						onClick={() => {
							const emptyRow: Record<string, ControlValue> = {};
							for (const col of control.columns) {
								emptyRow[col.key] = "";
							}
							const rows = [...(control.rows ?? []), emptyRow];
							onUpdate(control.id, { rows } as Partial<ITableControl>);
						}}
					>
						+ Add Row
					</Button>
				</CollapsibleSection>
			)}
		</>
	);
};
