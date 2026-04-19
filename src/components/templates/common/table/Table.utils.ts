import type { ControlValue, ITableSummaryTile } from "../../templates.models";
import { resolveBinding } from "../../template-renderer/bindingResolver";

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir } | null;

export type RowEntry = {
	row: Record<string, ControlValue>;
	raw: Record<string, unknown>;
};

export type ResolvedSummaryTile = ITableSummaryTile & {
	id: string;
	count: number;
};

export function compareCells(
	a: ControlValue,
	b: ControlValue,
	dir: SortDir,
): number {
	const aVal = a ?? "";
	const bVal = b ?? "";
	let result: number;

	if (typeof aVal === "number" && typeof bVal === "number") {
		result = aVal - bVal;
	} else {
		result = String(aVal).localeCompare(String(bVal), undefined, {
			numeric: true,
			sensitivity: "base",
		});
	}

	return dir === "desc" ? -result : result;
}

/**
 * Resolve `{field}` placeholders in an action template using the original
 * (unflattened) data-source row so nested paths resolve correctly.
 */
export function resolveActionTemplate(
	template: string,
	rawRow: Record<string, unknown>,
): string {
	return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (_match, path: string) => {
		const val = resolveBinding(path, rawRow);
		return val != null ? String(val) : "";
	});
}

function valuesEqual(actual: unknown, expected: ControlValue): boolean {
	if (expected == null) return actual == null;

	if (typeof expected === "number") {
		return Number(actual) === expected;
	}

	if (typeof expected === "boolean") {
		return actual === expected;
	}

	return String(actual ?? "").toLowerCase() === expected.toLowerCase();
}

function hasUsableFilterValue(value: ControlValue): boolean {
	if (value == null) return false;
	if (typeof value === "string") return value.trim().length > 0;
	return true;
}

export function matchesSummaryTile(
	entry: RowEntry,
	tile: ITableSummaryTile,
): boolean {
	if (tile.showAll || !tile.field || !hasUsableFilterValue(tile.value)) {
		return true;
	}

	const directVal = entry.row[tile.field];
	const resolvedVal =
		directVal !== undefined ? directVal : resolveBinding(tile.field, entry.raw);

	return valuesEqual(resolvedVal, tile.value);
}
