// ---------------------------------------------------------------------------
// Control type discriminant
// ---------------------------------------------------------------------------

import { IActionArgs } from "../ai-assistant-old/AIAssistant.models";

export enum ControlType {
	Field = "field",
	Button = "button",
	Table = "table",
	Badge = "badge",
	Image = "image",
	ProgressBar = "progressBar",
	InputField = "inputField",
	Separator = "separator",
}

// ---------------------------------------------------------------------------
// Reusable types
// ---------------------------------------------------------------------------

/** Primitive value type used by fields and table cells. */
export type ControlValue = string | number | boolean | null | undefined;

/**
 * A value that can be either a literal or a dot-path binding to server data.
 * When `binding` is set, the renderer resolves it against the server data at
 * runtime and the resolved value takes precedence over `value`.
 *
 * Example binding paths:
 *   "request.returnsIdentifier"
 *   "customer.address.city"
 *   "lineItems"              (resolves to an array for tables)
 */
export interface IBindable<T = ControlValue> {
	/** Static value — used when no binding is provided. */
	value?: T;
	/** Dot-path into the server data object. Overrides `value` when present. */
	binding?: string;
}

/** Badge color palette. */
export type BadgeColor =
	| "brand"
	| "danger"
	| "important"
	| "informative"
	| "severe"
	| "subtle"
	| "success"
	| "warning";

/** Button visual style. */
export type ButtonAppearance =
	| "primary"
	| "secondary"
	| "outline"
	| "subtle"
	| "transparent";

/** Section layout direction. */
export type SectionLayout = "stack" | "row" | "grid";

export type FooterAlignment = "start" | "center" | "end" | "space-between";

/** Where a button renders within its parent card or section. */
export type ButtonPlacement = "inline" | "header" | "footer";

// ---------------------------------------------------------------------------
// Element style — passed via JSON to control visual appearance
// ---------------------------------------------------------------------------

/**
 * A portable style object that can be serialised to JSON and applied
 * to any element (card, section, or control) at render time.
 *
 * Properties mirror a safe subset of CSS — values are plain strings or
 * numbers so they survive JSON round-trips without code execution risk.
 */
export interface IControlStyle {
	// Sizing
	width?: string | number;
	height?: string | number;
	minWidth?: string | number;
	maxWidth?: string | number;
	minHeight?: string | number;
	maxHeight?: string | number;

	// Spacing
	margin?: string | number;
	marginTop?: string | number;
	marginRight?: string | number;
	marginBottom?: string | number;
	marginLeft?: string | number;
	padding?: string | number;
	paddingTop?: string | number;
	paddingRight?: string | number;
	paddingBottom?: string | number;
	paddingLeft?: string | number;

	// Typography
	fontSize?: string | number;
	fontWeight?: string | number;
	textAlign?: "left" | "center" | "right";
	color?: string;

	// Background & border
	backgroundColor?: string;
	borderRadius?: string | number;
	borderWidth?: string | number;
	borderColor?: string;
	borderStyle?: "solid" | "dashed" | "dotted" | "none";

	// Layout
	alignSelf?: "auto" | "flex-start" | "flex-end" | "center" | "stretch";
	flex?: string | number;
	opacity?: number;
	overflow?: "visible" | "hidden" | "scroll" | "auto";
}

// ---------------------------------------------------------------------------
// Card → Section → Control hierarchy
// ---------------------------------------------------------------------------

/**
 * Root container rendered inside an AI Assistant message.
 * A Card is always the outermost wrapper.
 *
 * Content can live directly on the card via `children`, or be
 * organised into named `sections`, or both. When both are present
 * direct children render first, followed by sections.
 */
export interface ICardControl {
	/** Static title or binding e.g. { binding: "request.title" }. */
	title: string | IBindable<string>;
	/** Static subtitle or binding. */
	subtitle?: string | IBindable<string>;
	isCollapsible?: boolean;
	defaultExpanded?: boolean;
	layout?: SectionLayout;
	columns?: number;
	gap?: number;
	children?: ITemplateControl[];
	sections?: ISectionControl[];
	/**
	 * Interleaved display order of children and sections by id.
	 * When present, items render in this order; when absent, children first then sections.
	 */
	ordering?: string[];
	/** Custom inline styles applied to the card wrapper. */
	style?: IControlStyle;
	/** Fixed height for the card. When set, the body scrolls while header/footer stay fixed. */
	height?: string | number;
	/** Horizontal alignment of footer buttons. Defaults to 'end'. */
	footerAlignment?: FooterAlignment;
}

/**
 * A logical grouping of controls inside a Card.
 * Sections can be nested via `subsections` to arbitrary depth.
 */
export interface ISectionControl {
	id: string;
	/** Static label or binding. */
	label: string | IBindable<string>;
	isCollapsible?: boolean;
	defaultExpanded?: boolean;
	layout?: SectionLayout;
	columns?: number;
	gap?: number;
	children?: ITemplateControl[];
	subsections?: ISectionControl[];
	/**
	 * Interleaved display order of children and subsections by id.
	 * When present, items render in this order; when absent, children first then subsections.
	 */
	ordering?: string[];
	/** Custom inline styles applied to the section wrapper. */
	style?: IControlStyle;
	/** Fixed height for the section. When set, the body scrolls while header/footer stay fixed. */
	height?: string | number;
	/** Horizontal alignment of footer buttons. Defaults to 'end'. */
	footerAlignment?: FooterAlignment;
}

// ---------------------------------------------------------------------------
// Controls — discriminated union on `type`
// ---------------------------------------------------------------------------

interface IControlBase {
	id: string;
	type: ControlType;
	label?: string;
	visible?: boolean;
	disabled?: boolean;
	/** Custom inline styles applied to the control wrapper. */
	style?: IControlStyle;
}

export interface IFieldControl extends IControlBase {
	type: ControlType.Field;
	label: string;
	/** Static value or binding to server data. */
	value?: ControlValue;
	/** Dot-path to resolve value from server data. */
	binding?: string;
	format?: "text" | "date" | "currency" | "number";
}

export interface IButtonControl extends IControlBase {
	type: ControlType.Button;
	label: string;
	/**
	 * Prompt template sent as a chat message on click.
	 * Use `{key}` placeholders to interpolate values from the `data` object.
	 * Example: "Show details for order {orderId}"
	 */
	prompt: string;
	/** Static data or with bindings for individual keys. */
	data?: Record<string, unknown>;
	/** Bindings map — keys match `data` keys, values are dot-paths. */
	dataBindings?: Record<string, string>;
	appearance?: ButtonAppearance;
	/** When true, validates all InputField controls in the same container before firing. */
	validateForm?: boolean;
	/** Where this button renders: inline (default), in the header, or in the footer. */
	placement?: ButtonPlacement;
	/** Fluent icon export name, e.g. "Edit20Regular". */
	iconName?: string;
	/** Hover text shown on icon-only buttons. */
	tooltip?: string;
}

export interface ITableControl extends IControlBase {
	type: ControlType.Table;
	columns: ITableColumn[];
	/** Static rows. */
	rows?: Record<string, ControlValue>[];
	/** Original unflattened rows from the data source (populated at runtime). */
	rawRows?: Record<string, unknown>[];
	/** Dot-path binding to an array in server data, e.g. "lineItems". */
	binding?: string;
	/**
	 * Prompt template sent on row click. Use `{field}` to interpolate row data.
	 * Leave empty to disable row click.
	 */
	onRowClickPrompt?: string;
	/** Enable column sorting (default true). */
	sortable?: boolean;
	/** Enable a search/filter bar above the table (default true). */
	searchable?: boolean;
	/** Placeholder text for the search input (default "Search across all columns..."). */
	searchPlaceholder?: string;
	/** Show record count in the toolbar (default false). */
	showRecordCount?: boolean;
	/** Configurable summary tiles shown above the table for quick filtering. */
	summaryTiles?: ITableSummaryTile[];
}

export interface ITableSummaryTile {
	/** Optional stable id; if omitted, index-based id is used. */
	id?: string;
	/** Display label for the tile, e.g. "Total Proposals" or "Draft". */
	label: string;
	/** Fluent icon export name, e.g. "ClipboardText20Regular". */
	iconName?: string;
	/** Dot-path field in each row used for filtering, e.g. "status". */
	field?: string;
	/** Match value for the filter field. Ignored when `showAll` is true. */
	value?: ControlValue;
	/** Marks this tile as the "show all" option. */
	showAll?: boolean;
}

export interface ITableColumn {
	key: string;
	header: string;
	/** Dot-path into each row item when using binding source, e.g. "amount.value". */
	field?: string;
	minWidth?: number;
	sortable?: boolean;
	format?: "text" | "date" | "currency" | "number" | "badge" | "button";
	/**
	 * For button columns — prompt template sent on click.
	 * Use `{field}` to interpolate values from the row data.
	 */
	prompt?: string;
	/** For button columns — the button label. Defaults to the column header. */
	buttonLabel?: string;
}

export interface IBadgeControl extends IControlBase {
	type: ControlType.Badge;
	value?: string;
	/** Dot-path binding for the badge text. */
	binding?: string;
	color?: BadgeColor;
	/** Dot-path binding for badge color. */
	colorBinding?: string;
}

export interface IImageControl extends IControlBase {
	type: ControlType.Image;
	src?: string;
	/** Dot-path binding for image src. */
	binding?: string;
	alt?: string;
	width?: number | string;
	height?: number | string;
}

export interface IProgressBarControl extends IControlBase {
	type: ControlType.ProgressBar;
	value?: number;
	/** Dot-path binding for progress value. */
	binding?: string;
	max?: number;
}

// ---------------------------------------------------------------------------
// Form control — template-driven input form
// ---------------------------------------------------------------------------

/** Supported input types for form fields. */
export type FormInputType =
	| "text"
	| "textarea"
	| "number"
	| "date"
	| "dropdown"
	| "checkbox"
	| "toggle"
	| "radio";

/** A selectable option used by dropdown and radio inputs. */
export interface IFormOption {
	label: string;
	value: string;
}

/** Validation rules for a form input. */
export interface IFormValidation {
	/** Minimum length (text/textarea) or minimum value (number/date). */
	min?: number | string;
	/** Maximum length (text/textarea) or maximum value (number/date). */
	max?: number | string;
	/** Regex pattern the value must match. */
	pattern?: string;
	/** Custom error message shown when validation fails. */
	message?: string;
}

/** A form input field — renders as a child control inside a Form. */
export interface IInputFieldControl extends IControlBase {
	type: ControlType.InputField;
	/** Display label for the input. */
	label: string;
	/** Unique name — used as the key in the submitted form data. */
	name: string;
	/** The kind of input to render. */
	inputType: FormInputType;
	/** Placeholder / hint text. */
	placeholder?: string;
	/** Whether the field must have a value before submission. */
	required?: boolean;
	/** Default value — can be static or bound to server data. */
	defaultValue?: IBindable;
	/** Selectable options for dropdown and radio inputs. */
	options?: IFormOption[];
	/** Step increment for number inputs. */
	step?: number;
	/** Number of visible rows for textarea inputs. */
	rows?: number;
	/** Validation constraints. */
	validation?: IFormValidation;
}

/** A visual separator — renders a horizontal line. */
export interface ISeparatorControl extends IControlBase {
	type: ControlType.Separator;
	/** Optional text shown inline on the divider. */
	label?: string;
}

/** Union of all controls — narrow via `control.type`. */
export type ITemplateControl =
	| IFieldControl
	| IButtonControl
	| ITableControl
	| IBadgeControl
	| IImageControl
	| IProgressBarControl
	| IInputFieldControl
	| ISeparatorControl;

// ---------------------------------------------------------------------------
// Template root — what the agent response `data` field contains
// ---------------------------------------------------------------------------

export interface ITemplate {
	id: string;
	name: string;
	description?: string;
	version: string;
	card: ICardControl;
}

export const TEMPLATE_CONSTANTS = {
	HELLO_WORLD_TEMPLATE_ID: "hello_world_template",
};

/**
 * Returns the interleaved display order of controls and sections/subsections.
 * Each entry is `{ type: 'control', item }` or `{ type: 'section', item }`.
 * When `ordering` is present, items appear in that sequence; otherwise children first, then sections.
 */
export type OrderedItem =
	| { type: "control"; item: ITemplateControl }
	| { type: "section"; item: ISectionControl };

export const getOrderedItems = (
	children: ITemplateControl[] | undefined,
	sections: ISectionControl[] | undefined,
	ordering: string[] | undefined,
): OrderedItem[] => {
	const childMap = new Map((children ?? []).map((c) => [c.id, c]));
	const sectionMap = new Map((sections ?? []).map((s) => [s.id, s]));

	if (ordering?.length) {
		const result: OrderedItem[] = [];
		for (const id of ordering) {
			const c = childMap.get(id);
			if (c) {
				result.push({ type: "control", item: c });
				childMap.delete(id);
				continue;
			}
			const s = sectionMap.get(id);
			if (s) {
				result.push({ type: "section", item: s });
				sectionMap.delete(id);
			}
		}
		// Append any items not in the ordering (backward compat)
		for (const c of childMap.values())
			result.push({ type: "control", item: c });
		for (const s of sectionMap.values())
			result.push({ type: "section", item: s });
		return result;
	}

	// Fallback: children first, then sections
	const result: OrderedItem[] = [];
	for (const c of children ?? []) result.push({ type: "control", item: c });
	for (const s of sections ?? []) result.push({ type: "section", item: s });
	return result;
};

export interface IControlProps {
	onAction?: (action: string, payload: IActionArgs) => void;
	/** Full server data for resolving global bindings in prompts. */
	serverData?: Record<string, unknown>;
}
