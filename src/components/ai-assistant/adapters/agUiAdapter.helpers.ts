/**
 * Pure helpers used by `agUiAdapter`. Extracted into their own module so
 * each is individually unit-testable and the adapter file stays focused
 * on the AG-UI bridge logic.
 */
import type { IChatMessageData } from "../AIAssistant.types";
import type { MapDataFn } from "./types";

// ---------------------------------------------------------------------------
// MCP content unwrap
// ---------------------------------------------------------------------------

/** Discriminator for an MCP content block (`{ type: "text", text: "…" }`). */
export const isMcpContentBlock = (
	v: unknown,
): v is { type: string; text?: string } =>
	typeof v === "object" &&
	v !== null &&
	(v as { type?: unknown }).type === "text" &&
	typeof (v as { text?: unknown }).text === "string";

/**
 * MCP tools return their payload as a `[{type:"text", text:"<inner>"}]`
 * wrapper. Treating that wrapper as the assistant payload causes the
 * Adaptive-Card renderer to render a useless 2-column "Type | Text" grid.
 * This helper detects the shape and returns the inner content (parsed as
 * JSON when possible).
 */
export const unwrapMcpContent = (parsed: unknown): unknown => {
	if (isMcpContentBlock(parsed)) {
		const inner = (parsed as { text: string }).text;
		try {
			return JSON.parse(inner);
		} catch {
			return inner;
		}
	}
	if (
		Array.isArray(parsed) &&
		parsed.length > 0 &&
		parsed.every(isMcpContentBlock)
	) {
		const texts = (parsed as Array<{ text: string }>).map((b) => b.text);
		if (texts.length === 1) {
			try {
				return JSON.parse(texts[0]);
			} catch {
				return texts[0];
			}
		}
		const parsedAll: unknown[] = [];
		let allJson = true;
		for (const t of texts) {
			try {
				parsedAll.push(JSON.parse(t));
			} catch {
				allJson = false;
				break;
			}
		}
		return allJson ? parsedAll : texts.join("\n\n");
	}
	return parsed;
};

// ---------------------------------------------------------------------------
// Label coercion
// ---------------------------------------------------------------------------

/**
 * Convert any value into a single-line status label, or "" if not
 * suitable. Strings pass through (collapsed). Objects with a recognizable
 * label-ish field win; otherwise we stringify and truncate.
 */
export const coerceToLabel = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		for (const k of ["title", "label", "status", "message", "text", "name"]) {
			const v = obj[k];
			if (typeof v === "string" && v.trim()) {
				return v.replace(/\s+/g, " ").trim();
			}
		}
		try {
			return JSON.stringify(value).slice(0, 80);
		} catch {
			return "";
		}
	}
	return "";
};

/**
 * Build a label from an AG-UI activity message: prefer a string field on
 * the server-supplied `content`, fall back to the `activityType` slug.
 */
export const extractActivityLabel = (
	activityType: string | undefined,
	content: Record<string, unknown> | undefined,
): string => {
	const fromContent = coerceToLabel(content);
	if (fromContent) return fromContent;
	if (activityType) return activityType.replace(/[_-]/g, " ");
	return "";
};

// ---------------------------------------------------------------------------
// Tool / step name humanization
// ---------------------------------------------------------------------------

const VERB_MAP: Record<string, string> = {
	get: "Getting",
	fetch: "Fetching",
	search: "Searching",
	find: "Finding",
	list: "Listing",
	query: "Querying",
	read: "Reading",
	load: "Loading",
	create: "Creating",
	add: "Adding",
	update: "Updating",
	save: "Saving",
	delete: "Deleting",
	remove: "Removing",
	send: "Sending",
	post: "Posting",
	run: "Running",
	execute: "Executing",
	build: "Building",
	generate: "Generating",
	render: "Rendering",
	analyze: "Analyzing",
	calculate: "Calculating",
	compute: "Computing",
	validate: "Validating",
	check: "Checking",
	plan: "Planning",
	process: "Processing",
};

const HUMANIZE_CACHE_LIMIT = 200;
const humanizeToolNameCache = new Map<string, string>();
const humanizePhraseCache = new Map<string, string>();

const cacheSet = (cache: Map<string, string>, key: string, value: string) => {
	if (cache.size >= HUMANIZE_CACHE_LIMIT) {
		// FIFO eviction keeps the cache bounded for very long-running
		// sessions where many distinct tool names appear.
		const firstKey = cache.keys().next().value;
		if (firstKey !== undefined) cache.delete(firstKey);
	}
	cache.set(key, value);
};

export const tokenize = (raw: string): string[] =>
	raw
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.split(/\s+/)
		.filter(Boolean);

/**
 * Sentence-case a programmatic identifier: `getUserProfile` → "Get user profile".
 * Memoized; safe to call frequently.
 */
export const humanizePhrase = (raw: string): string => {
	const cached = humanizePhraseCache.get(raw);
	if (cached !== undefined) return cached;
	const tokens = tokenize(raw);
	const result =
		tokens.length === 0
			? ""
			: tokens
					.map((t, i) =>
						i === 0
							? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
							: t.toLowerCase(),
					)
					.join(" ");
	cacheSet(humanizePhraseCache, raw, result);
	return result;
};

/**
 * Humanize a tool/function name into a verb-phrase status label.
 * Examples:
 *   `SearchTravelContent`       → "Searching travel content"
 *   `getUserProfile`            → "Getting user profile"
 *   `agent_BookingAgent`        → "Delegating to booking agent"
 *   `mcp_weather_fetchForecast` → "Fetching forecast"
 * Falls back to the original name when no recognized verb prefix matches.
 * Memoized; safe to call frequently.
 */
export const humanizeToolName = (raw: string): string => {
	if (!raw) return "";
	const cached = humanizeToolNameCache.get(raw);
	if (cached !== undefined) return cached;
	const result = computeHumanizeToolName(raw);
	cacheSet(humanizeToolNameCache, raw, result);
	return result;
};

const computeHumanizeToolName = (raw: string): string => {
	// Recognized convention prefixes from the TechTrips agent host:
	//   `agent_<AgentName>`        — A2A delegation tool (one per remote agent)
	//   `mcp_<server>_<toolName>`  — MCP-server-backed tool
	const a2a = /^agent[_-]+(.+)$/i.exec(raw);
	if (a2a) {
		const target = humanizePhrase(a2a[1]);
		return target ? `Delegating to ${target}` : "Delegating to agent";
	}
	const mcp = /^mcp[_-]+[^_-]+[_-]+(.+)$/i.exec(raw);
	if (mcp) {
		const inner = humanizeToolName(mcp[1]);
		return inner || humanizePhrase(mcp[1]);
	}

	const tokens = tokenize(raw);
	if (tokens.length === 0) return raw;
	const head = tokens[0].toLowerCase();
	const verb = VERB_MAP[head];
	if (verb) {
		const rest = tokens
			.slice(1)
			.map((t) => t.toLowerCase())
			.join(" ");
		return rest ? `${verb} ${rest}` : verb;
	}
	return humanizePhrase(raw);
};

// ---------------------------------------------------------------------------
// Result-payload summaries
// ---------------------------------------------------------------------------

/**
 * Best-effort summary of a tool result payload — used to surface a
 * "Received N items / N KB" milestone in the activity log so the user
 * sees forward motion between the tool finishing and the model
 * starting to draft a reply.
 */
export const describeResultSize = (raw: string): string => {
	if (!raw || typeof raw !== "string") return "";
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		const len = raw.length;
		if (len < 80) return "";
		return `${Math.round(len / 100) / 10} KB`;
	}
	const unwrapped = unwrapMcpContent(parsed);
	if (Array.isArray(unwrapped)) {
		return unwrapped.length === 1 ? "1 item" : `${unwrapped.length} items`;
	}
	if (unwrapped && typeof unwrapped === "object") {
		const keys = Object.keys(unwrapped as Record<string, unknown>);
		const items = (unwrapped as Record<string, unknown>).items;
		if (Array.isArray(items)) {
			return `${items.length} items`;
		}
		const results = (unwrapped as Record<string, unknown>).results;
		if (Array.isArray(results)) {
			return `${results.length} results`;
		}
		if (keys.length > 0) return `${keys.length} fields`;
	}
	return "";
};

/**
 * Pretty-print a raw payload (JSON or string) so it can be shown
 * inline under an activity row. Returns the full text — the UI applies
 * a scrollable max-height and provides a copy action.
 */
export const prettifyDetail = (raw: string): string => {
	if (!raw || typeof raw !== "string") return "";
	try {
		const parsed = JSON.parse(raw);
		const unwrapped = unwrapMcpContent(parsed);
		return typeof unwrapped === "string"
			? unwrapped
			: JSON.stringify(unwrapped, null, 2);
	} catch {
		return raw;
	}
};

// ---------------------------------------------------------------------------
// Default tool-call → IChatMessageData mapper
// ---------------------------------------------------------------------------

/**
 * Default data mapper: tool results → payload (stringified), first tool
 * name → templateId. Works for agents that follow the convention of
 * tool name = template name. Override `AgUiAdapterOptions.mapData` for
 * agents whose conventions differ.
 */
export const defaultMapData: MapDataFn = (toolCalls): IChatMessageData => {
	const results = toolCalls
		.filter((tc) => tc.result)
		.map((tc) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: guarded by filter
				return unwrapMcpContent(JSON.parse(tc.result!));
			} catch {
				return tc.result;
			}
		});
	let payload: string | undefined;
	if (results.length > 0) {
		const p = results.length === 1 ? results[0] : results;
		// Only expose a payload when the unwrapped result is structured
		// data the AC / template / dynamic-ui renderers can consume; plain
		// strings should fall through to the assistant's markdown text.
		if (p !== null && p !== undefined && typeof p === "object") {
			payload = JSON.stringify(p);
		}
	}
	const templateId = toolCalls[0]?.name || undefined;
	const toolsUsed = toolCalls.map((tc) => tc.name).filter(Boolean);
	return {
		...(payload && { payload }),
		...(templateId && { templateId }),
		...(toolsUsed.length > 0 && { toolsUsed }),
	};
};
