import * as AdaptiveCards from "adaptivecards";

// ---------------------------------------------------------------------------
// Adaptive Card renderer — smart layout selection based on data shape
//
// Uses proper AC elements: Container, ColumnSet/Column, Image, TextBlock,
// FactSet, and Action.OpenUrl — following the Adaptive Cards schema at
// https://adaptivecards.io/explorer/
// ---------------------------------------------------------------------------

export type ACElement = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Adapter interface — consumers can override any stage of the rendering flow
// ---------------------------------------------------------------------------

/**
 * Adapter interface for controlling the Adaptive Card rendering pipeline.
 * Implement this to customise host config, layout selection, or post-processing.
 * Use `defaultAdaptiveCardAdapter` as a starting point and override individual methods.
 */
export interface IAdaptiveCardAdapter {
	/** Build the host config JSON passed to the AC SDK. */
	buildHostConfig(theme: "light" | "dark"): Record<string, unknown>;

	/** Convert parsed data to Adaptive Card body elements. Return empty array to skip AC rendering. */
	dataToCardBody(data: unknown): ACElement[];

	/** Post-process the rendered DOM element before serialisation to HTML. */
	postProcess(root: HTMLElement, cardJson: Record<string, unknown>): void;
}

// ---------------------------------------------------------------------------
// Host config (theme-aware)
// ---------------------------------------------------------------------------

const buildHostConfigJson = (
	theme: "light" | "dark" = "light",
): Record<string, unknown> => {
	const isDark = theme === "dark";
	return {
		fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
		containerStyles: {
			default: {
				backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
				foregroundColors: {
					default: {
						default: isDark ? "#e0e0e0" : "#333333",
						subtle: isDark ? "#a0a0a0" : "#6b6b6b",
					},
					accent: {
						default: isDark ? "#4ea8f0" : "#0078d4",
						subtle: isDark ? "#4ea8f0" : "#0078d4",
					},
					good: { default: "#54a254", subtle: "#DD54a254" },
					warning: { default: "#e69500", subtle: "#DDe69500" },
					attention: { default: "#d13438", subtle: "#DDd13438" },
				},
			},
			emphasis: {
				backgroundColor: isDark ? "#2d2d2d" : "#f5f5f5",
				foregroundColors: {
					default: {
						default: isDark ? "#e0e0e0" : "#333333",
						subtle: isDark ? "#a0a0a0" : "#6b6b6b",
					},
					accent: {
						default: isDark ? "#4ea8f0" : "#0078d4",
						subtle: isDark ? "#4ea8f0" : "#0078d4",
					},
					good: { default: "#54a254", subtle: "#DD54a254" },
					warning: { default: "#e69500", subtle: "#DDe69500" },
					attention: { default: "#d13438", subtle: "#DDd13438" },
				},
			},
		},
		spacing: {
			small: 4,
			default: 8,
			medium: 12,
			large: 16,
			extraLarge: 24,
			padding: 12,
		},
		separator: {
			lineThickness: 1,
			lineColor: isDark ? "#404040" : "#e0e0e0",
		},
		imageSizes: { small: 40, medium: 80, large: 160 },
		factSet: {
			title: {
				color: "default",
				size: "default",
				isSubtle: true,
				weight: "bolder",
			},
			value: {
				color: "default",
				size: "default",
				isSubtle: false,
				weight: "default",
			},
			spacing: 8,
		},
	};
};

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

/** Keys that carry storage / transport metadata — never useful to display. */
const EXCLUDED_KEYS = new Set([
	"etag",
	"odata.etag",
	"odata.metadata",
	"partitionkey",
	"rowkey",
	"timestamp",
	"_metadata",
	"__metadata",
]);

const isScalar = (v: unknown): v is string | number | boolean | null =>
	v === null || typeof v !== "object";

const looksLikeId = (key: string, v: unknown): boolean => {
	if (typeof v !== "string") return false;
	if (/^W\/"/.test(v)) return true;
	if ((v.match(/%[0-9A-Fa-f]{2}/g)?.length ?? 0) > 2) return true;
	const lower = key.toLowerCase();
	if (
		(lower === "id" || lower === "rowkey" || lower.endsWith("id")) &&
		/^[0-9a-f-]{32,}$/i.test(v)
	)
		return true;
	return false;
};

const looksLikeHtml = (v: unknown): boolean =>
	typeof v === "string" && /<[a-z][a-z0-9]*[\s>]/i.test(v);

const isImageUrl = (v: unknown): boolean =>
	typeof v === "string" &&
	/^https?:\/\/.+\.(jpe?g|png|gif|webp|svg|bmp)/i.test(v);

const isUrl = (v: unknown): boolean =>
	typeof v === "string" && /^https?:\/\//i.test(v);

const stripHtml = (html: string): string =>
	html
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, " ")
		.trim();

const formatDate = (v: string): string => {
	if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return v;
	const d = new Date(v);
	if (Number.isNaN(d.getTime())) return v;
	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const formatLabel = (key: string): string =>
	key
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());

/** Format a value for display — dates are humanized, HTML stripped. */
const displayValue = (v: unknown): string => {
	if (v === null || v === undefined) return "\u2014";
	const s = String(v);
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return formatDate(s);
	if (looksLikeHtml(s)) return stripHtml(s);
	return s;
};

// ---------------------------------------------------------------------------
// Field finders — locate well-known fields by convention
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;

/** Find first matching key (case-insensitive). */
const findField = (obj: Obj, ...candidates: string[]): string | undefined => {
	const keys = Object.keys(obj);
	for (const c of candidates) {
		const lower = c.toLowerCase();
		const found = keys.find((k) => k.toLowerCase() === lower);
		if (found !== undefined && obj[found] !== null && obj[found] !== undefined)
			return found;
	}
	return undefined;
};

const getString = (obj: Obj, ...candidates: string[]): string | undefined => {
	const key = findField(obj, ...candidates);
	if (!key) return undefined;
	const v = obj[key];
	return typeof v === "string" && v.length > 0 ? v : undefined;
};

const getNumber = (obj: Obj, ...candidates: string[]): number | undefined => {
	const key = findField(obj, ...candidates);
	if (!key) return undefined;
	const v = obj[key];
	return typeof v === "number" ? v : undefined;
};

// ---------------------------------------------------------------------------
// Data shape detection
// ---------------------------------------------------------------------------

/** An object that has a title/name + at least 2 other meaningful fields. */
const isRichItem = (obj: Obj): boolean => {
	const hasTitle = !!(
		getString(obj, "title", "name", "label", "heading", "subject") ||
		getString(obj, "authorName", "author")
	);
	if (!hasTitle) return false;

	let meaningful = 0;
	for (const [k, v] of Object.entries(obj)) {
		if (EXCLUDED_KEYS.has(k.toLowerCase())) continue;
		if (looksLikeId(k, v)) continue;
		if (v !== null && v !== undefined) meaningful++;
		if (meaningful >= 4) return true;
	}
	return false;
};

// ---------------------------------------------------------------------------
// Layout builders — each returns ACElement[] for the card body
// ---------------------------------------------------------------------------

/**
 * Layout 1: List of rich items — each rendered as a mini-card
 * with optional thumbnail, title, subtitle line, and excerpt.
 */
const buildItemList = (items: Obj[]): ACElement[] => {
	const body: ACElement[] = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const title = getString(
			item,
			"title",
			"name",
			"label",
			"heading",
			"subject",
		);
		const image = getString(
			item,
			"coverImageUrl",
			"imageUrl",
			"image",
			"thumbnail",
			"avatar",
			"photo",
		);
		const author = getString(item, "authorName", "author", "createdBy");
		const category = getString(item, "category", "type", "genre", "topic");
		const date = getString(
			item,
			"createdAt",
			"publishedAt",
			"date",
			"updatedAt",
		);
		const excerpt = getString(
			item,
			"excerpt",
			"summary",
			"description",
			"subtitle",
		);
		const contentField = getString(item, "content", "body", "text");
		const itemUrl = getString(item, "url", "link");
		const views = getNumber(item, "views");
		const likes = getNumber(item, "likes");
		const level = getString(item, "level");
		const duration = getString(item, "duration");
		const rating = getNumber(item, "rating");
		const city = getString(item, "city");
		const country = getString(item, "country");

		// Build subtitle parts
		const subtitleParts: string[] = [];
		if (author) subtitleParts.push(author);
		if (category) subtitleParts.push(category);
		if (date) subtitleParts.push(formatDate(date));

		// Build detail chips — text symbols for consistent rendering
		const chips: string[] = [];
		if (level) chips.push(level);
		if (duration) chips.push("\u23F1 " + duration);
		if (city || country) chips.push([city, country].filter(Boolean).join(", "));
		if (rating !== undefined) chips.push("\u2605 " + rating);
		if (views !== undefined) chips.push(views + " views");
		if (likes !== undefined) chips.push(likes + " likes");

		// Build the text column items
		const textItems: ACElement[] = [];

		if (title) {
			textItems.push({
				type: "TextBlock",
				text: title,
				weight: "bolder",
				size: "medium",
				color: "accent",
				wrap: true,
			});
		}

		if (subtitleParts.length > 0) {
			textItems.push({
				type: "TextBlock",
				text: subtitleParts.join(" \u00b7 "),
				size: "small",
				isSubtle: true,
				spacing: "none",
				wrap: true,
			});
		}

		// Short description — prefer excerpt, else strip HTML from content
		const desc =
			excerpt ||
			(contentField && looksLikeHtml(contentField)
				? stripHtml(contentField)
				: contentField);
		if (desc) {
			const truncated = desc.length > 90 ? desc.slice(0, 90) + "\u2026" : desc;
			textItems.push({
				type: "TextBlock",
				text: truncated,
				size: "small",
				wrap: true,
				spacing: "small",
			});
		}

		if (chips.length > 0) {
			textItems.push({
				type: "TextBlock",
				text: chips.join(" \u00b7 "),
				size: "small",
				isSubtle: true,
				spacing: "small",
				wrap: true,
			});
		}

		// Compose card: image + text columns, or text only
		let cardContent: ACElement;

		if (image && isImageUrl(image)) {
			cardContent = {
				type: "ColumnSet",
				columns: [
					{
						type: "Column",
						width: "auto",
						items: [
							{
								type: "Image",
								url: image,
								size: "small",
								width: "48px",
								altText: title || "Thumbnail",
								style: "default",
							},
						],
						verticalContentAlignment: "top",
					},
					{
						type: "Column",
						width: "stretch",
						items: textItems,
					},
				],
			};
		} else {
			cardContent = {
				type: "Container",
				items: textItems,
			};
		}

		// Build actions for the item
		const actions: ACElement[] = [];
		if (itemUrl) {
			actions.push({
				type: "Action.OpenUrl",
				title: "View",
				url: itemUrl,
			});
		}

		// Wrap in a Container with emphasis style for card-like grouping
		const containerItems: ACElement[] = [cardContent];
		if (actions.length > 0) {
			containerItems.push({ type: "ActionSet", actions });
		}

		const container: ACElement = {
			type: "Container",
			style: "emphasis",
			items: containerItems,
			spacing: i > 0 ? "small" : "default",
			bleed: false,
		};

		body.push(container);
	}

	return body;
};

/**
 * Layout 2: Single rich item — detail card with cover image,
 * title, metadata FactSet, description, and actions.
 */
const buildDetailCard = (obj: Obj): ACElement[] => {
	const body: ACElement[] = [];

	const title = getString(obj, "title", "name", "label", "heading", "subject");
	const image = getString(
		obj,
		"coverImageUrl",
		"imageUrl",
		"image",
		"thumbnail",
		"photo",
	);
	const excerpt = getString(
		obj,
		"excerpt",
		"summary",
		"description",
		"subtitle",
	);
	const contentField = getString(obj, "content", "body", "text");
	const itemUrl = getString(obj, "url", "link");

	// Cover image
	if (image && isImageUrl(image)) {
		body.push({
			type: "Image",
			url: image,
			size: "stretch",
			altText: title || "Cover image",
		});
	}

	// Title
	if (title) {
		body.push({
			type: "TextBlock",
			text: title,
			weight: "bolder",
			size: "large",
			wrap: true,
		});
	}

	// Metadata FactSet — collect all displayable scalar fields excluding title,
	// content-like fields, and image URLs
	const skipKeys = new Set([
		"title",
		"name",
		"label",
		"heading",
		"subject",
		"content",
		"body",
		"text",
		"excerpt",
		"summary",
		"description",
		"slug",
		"url",
		"link",
		"coverimageurl",
		"imageurl",
		"image",
		"thumbnail",
		"photo",
		"tags",
		"prerequisites",
		"highlights",
		"modules",
	]);

	const facts: { title: string; value: string }[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const lower = k.toLowerCase();
		if (EXCLUDED_KEYS.has(lower)) continue;
		if (skipKeys.has(lower)) continue;
		if (!isScalar(v)) continue;
		if (looksLikeId(k, v)) continue;
		if (isUrl(v)) continue;
		if (v === null || v === undefined || String(v).trim() === "") continue;
		facts.push({ title: formatLabel(k), value: displayValue(v) });
	}

	if (facts.length > 0) {
		body.push({
			type: "FactSet",
			facts,
			separator: true,
		});
	}

	// Description
	const desc =
		excerpt ||
		(contentField && looksLikeHtml(contentField)
			? stripHtml(contentField)
			: contentField);
	if (desc) {
		const truncated = desc.length > 300 ? desc.slice(0, 300) + "\u2026" : desc;
		body.push({
			type: "TextBlock",
			text: truncated,
			wrap: true,
			separator: true,
			spacing: "medium",
		});
	}

	// JSON-encoded arrays: tags, highlights, prerequisites
	for (const arrKey of ["tags", "highlights", "prerequisites"]) {
		const raw = getString(obj, arrKey);
		if (!raw) continue;
		try {
			const arr = JSON.parse(raw) as string[];
			if (Array.isArray(arr) && arr.length > 0) {
				body.push({
					type: "TextBlock",
					text: "**" + formatLabel(arrKey) + ":** " + arr.join(", "),
					wrap: true,
					size: "small",
					spacing: "small",
				});
			}
		} catch {
			/* skip unparseable */
		}
	}

	// Action
	if (itemUrl) {
		body.push({
			type: "ActionSet",
			actions: [
				{
					type: "Action.OpenUrl",
					title: "View Full Article",
					url: itemUrl,
				},
			],
		});
	}

	return body;
};

/**
 * Layout 3: Simple key-value object — FactSet.
 */
const buildFactSetLayout = (obj: Obj): ACElement[] => {
	const facts: { title: string; value: string }[] = [];
	for (const [k, v] of Object.entries(obj)) {
		if (EXCLUDED_KEYS.has(k.toLowerCase())) continue;
		if (!isScalar(v)) continue;
		if (looksLikeId(k, v)) continue;
		if (isImageUrl(v)) continue;
		if (v === null || v === undefined || String(v).trim() === "") continue;
		facts.push({ title: formatLabel(k), value: displayValue(v) });
	}
	if (facts.length === 0) return [];
	return [{ type: "FactSet", facts }];
};

/**
 * Layout 4: Table for arrays of simple objects (few fields, no title/image).
 */
const buildSimpleTable = (rows: Obj[]): ACElement[] => {
	const allKeys = new Map<string, number>();
	for (const row of rows) {
		for (const [k, v] of Object.entries(row)) {
			if (EXCLUDED_KEYS.has(k.toLowerCase())) continue;
			if (!isScalar(v)) continue;
			if (looksLikeId(k, v)) continue;
			if (isUrl(v)) continue;
			if (v !== null && v !== undefined && String(v).trim() !== "")
				allKeys.set(k, (allKeys.get(k) ?? 0) + 1);
		}
	}

	const cols = [...allKeys.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([k]) => k);

	if (cols.length === 0) return [];

	const elements: ACElement[] = [];

	// Header
	elements.push({
		type: "ColumnSet",
		columns: cols.map((col) => ({
			type: "Column",
			width: "stretch",
			items: [
				{
					type: "TextBlock",
					text: formatLabel(col),
					weight: "bolder",
					size: "small",
					isSubtle: true,
				},
			],
		})),
	});

	// Rows
	for (const row of rows) {
		elements.push({
			type: "ColumnSet",
			columns: cols.map((col) => ({
				type: "Column",
				width: "stretch",
				items: [
					{
						type: "TextBlock",
						text: displayValue(row[col]),
						wrap: true,
						size: "small",
					},
				],
			})),
			separator: true,
			spacing: "small",
		});
	}

	return elements;
};

// ---------------------------------------------------------------------------
// Main layout router — picks the best layout for the data
// ---------------------------------------------------------------------------

const dataToCardBody = (data: unknown): ACElement[] => {
	if (data === null || data === undefined) return [];

	// Scalar -> single large text
	if (typeof data !== "object") {
		return [
			{
				type: "TextBlock",
				text: String(data),
				size: "large",
				weight: "bolder",
				wrap: true,
			},
		];
	}

	// Array
	if (Array.isArray(data)) {
		if (data.length === 0) return [];

		// Array of scalars -> bullet list
		if (typeof data[0] !== "object" || data[0] === null) {
			return data.map((v) => ({
				type: "TextBlock",
				text: "\u2022 " + displayValue(v),
				wrap: true,
				size: "small",
			}));
		}

		const items = data as Obj[];
		// Array of rich items -> item list cards
		if (items.some(isRichItem)) {
			return buildItemList(items);
		}
		// Array of simple objects -> table
		return buildSimpleTable(items);
	}

	// Single object
	const obj = data as Obj;

	// Check for wrapper: { items: [...], totalCount: 5 } or { data: [...] }
	const entries = Object.entries(obj);
	const arrayEntry = entries.find(
		([, v]) => Array.isArray(v) && (v as unknown[]).length > 0,
	);

	if (arrayEntry) {
		const [, arr] = arrayEntry;
		const items = arr as unknown[];

		const body: ACElement[] = [];

		// Recurse into the array
		if (typeof items[0] === "object" && items[0] !== null) {
			const objItems = items as Obj[];
			if (objItems.some(isRichItem)) {
				body.push(...buildItemList(objItems));
			} else {
				body.push(...buildSimpleTable(objItems));
			}
		} else {
			body.push(
				...items.map((v) => ({
					type: "TextBlock" as const,
					text: "\u2022 " + displayValue(v),
					wrap: true,
					size: "small" as const,
				})),
			);
		}

		return body;
	}

	// Single rich item -> detail card
	if (isRichItem(obj)) {
		return buildDetailCard(obj);
	}

	// Plain key-value -> FactSet
	return buildFactSetLayout(obj);
};

// ---------------------------------------------------------------------------
// Action patching — AC SDK renders Action.OpenUrl as <button> with JS
// handlers, which are lost when serialized to outerHTML. We replace
// them with native <a> tags so links work inside shadow DOM.
// ---------------------------------------------------------------------------

/** Recursively collect Action.OpenUrl title→url pairs from card JSON. */
const collectActionUrls = (node: unknown, map: Map<string, string>): void => {
	if (node === null || typeof node !== "object") return;
	if (Array.isArray(node)) {
		for (const item of node) collectActionUrls(item, map);
		return;
	}
	const obj = node as Obj;
	if (
		obj.type === "Action.OpenUrl" &&
		typeof obj.url === "string" &&
		typeof obj.title === "string"
	) {
		map.set(obj.title, obj.url);
	}
	for (const v of Object.values(obj)) {
		if (typeof v === "object" && v !== null) collectActionUrls(v, map);
	}
};

/** Replace AC-rendered <button> elements with <a> links for OpenUrl actions. */
const patchActionButtons = (
	root: HTMLElement,
	cardJson: Record<string, unknown>,
): void => {
	const urls = new Map<string, string>();
	collectActionUrls(cardJson, urls);
	if (urls.size === 0) return;

	const buttons = Array.from(root.querySelectorAll("button"));
	for (const button of buttons) {
		const title = button.textContent?.trim();
		if (!title || !urls.has(title)) continue;
		const url = urls.get(title)!;

		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.target = "_blank";
		anchor.rel = "noopener noreferrer";
		anchor.textContent = title;
		anchor.className = button.className;
		const style = button.getAttribute("style");
		if (style) anchor.setAttribute("style", style);

		button.parentNode?.replaceChild(anchor, button);
	}
};

// ---------------------------------------------------------------------------
// Default adapter — wraps the built-in functions so consumers can compose
// ---------------------------------------------------------------------------

/** Default adapter that provides the built-in smart-layout rendering. */
export const defaultAdaptiveCardAdapter: IAdaptiveCardAdapter = {
	buildHostConfig: (theme) => buildHostConfigJson(theme),
	dataToCardBody: (data) => dataToCardBody(data),
	postProcess: (root, cardJson) => patchActionButtons(root, cardJson),
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const isAdaptiveCard = (data: unknown): boolean =>
	data !== null &&
	typeof data === "object" &&
	!Array.isArray(data) &&
	(data as Obj).type === "AdaptiveCard";

/**
 * Renders a JSON payload string as an Adaptive Card.
 * - If the payload is already Adaptive Card JSON → render directly.
 * - Otherwise, auto-detect the best layout and convert to AC schema.
 * Action.OpenUrl buttons are patched into native <a> links so they
 * work inside shadow DOM without JS event handlers.
 *
 * Pass a custom `IAdaptiveCardAdapter` to override host config,
 * layout selection, or post-processing. Falls back to `defaultAdaptiveCardAdapter`.
 *
 * Returns HTML string or undefined on failure.
 */
export const renderAdaptiveCard = (
	payload: string,
	theme?: "light" | "dark",
	adapter?: IAdaptiveCardAdapter,
): string | undefined => {
	const impl = adapter ?? defaultAdaptiveCardAdapter;

	let data: unknown;
	try {
		data = JSON.parse(payload);
	} catch {
		return undefined;
	}
	if (data === null || data === undefined) return undefined;

	let cardJson: Record<string, unknown>;
	if (isAdaptiveCard(data)) {
		cardJson = data as Obj;
	} else {
		const body = impl.dataToCardBody(data);
		if (!body || body.length === 0) return undefined;
		cardJson = { type: "AdaptiveCard", version: "1.5", body };
	}

	// Skip if body is empty
	const body = cardJson.body as ACElement[];
	if (!body || body.length === 0) return undefined;

	try {
		const card = new AdaptiveCards.AdaptiveCard();
		card.hostConfig = new AdaptiveCards.HostConfig(
			impl.buildHostConfig(theme ?? "light"),
		);
		card.parse(cardJson);
		const rendered = card.render();
		if (!rendered) return undefined;

		impl.postProcess(rendered, cardJson);

		return rendered.outerHTML;
	} catch (err) {
		console.error("[ai-assistant] Adaptive Card rendering failed:", err);
		return undefined;
	}
};
