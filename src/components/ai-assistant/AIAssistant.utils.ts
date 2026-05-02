import type { IAIAssistantService } from "./AIAssistant.services";
import type {
	AIAssistantPermission,
	IAIAssistantSettings,
	IChatMessage,
} from "./AIAssistant.types";
import {
	type IMessageRenderer,
	MessageRendererType,
	type RenderResult,
	defaultMessageRenderers,
} from "./messageRenderers";
import {
	DEFAULT_ENABLED_RENDERERS,
	DEFAULT_SETTINGS,
} from "./AIAssistant.types";

export const checkPermission = (
	permissions: AIAssistantPermission[] | undefined,
	permission: AIAssistantPermission,
): boolean => permissions?.includes(permission) ?? false;

/**
 * Returns true when the message should go through the rendering pipeline.
 * Resolves on:
 *   - `data.payload` or `data.templateId` (structured data → template / card / dynamic UI)
 *   - any non-empty assistant `content` (plain text / markdown → markdown renderer)
 */
export const needsResolution = (message: IChatMessage): boolean => {
	if (message.role !== "assistant") return false;
	if (typeof message.content === "string" && message.content.length > 0) {
		return true;
	}
	const data = message.data;
	if (!data) return false;
	return !!(data.payload || data.templateId);
};

/**
 * In-flight / resolved cache keyed by message ID.
 * Guarantees exactly one HTTP request per message regardless of
 * how many times React calls resolveMessage (StrictMode, re-renders, etc.).
 *
 * LRU semantics: a cache hit re-promotes the entry to the most-recent
 * position so frequently-viewed messages survive eviction in long
 * sessions. `Map` preserves insertion order, so we delete + re-set on
 * read to move an entry to the tail.
 */
const MAX_CACHE_SIZE = 200;
const resolveCache = new Map<
	string,
	{
		promise: Promise<RenderResult>;
		done: boolean;
		result?: RenderResult;
	}
>();

const evictOldestEntries = () => {
	if (resolveCache.size <= MAX_CACHE_SIZE) return;
	const excess = resolveCache.size - MAX_CACHE_SIZE;
	const keys = resolveCache.keys();
	for (let i = 0; i < excess; i++) {
		const { value } = keys.next();
		if (value) resolveCache.delete(value);
	}
};

/**
 * Returns the synchronously-available resolved result for a message,
 * or null if not yet resolved. Promotes the entry to the LRU tail on hit.
 */
export const getResolvedFromCache = (
	messageId: string,
): { result: RenderResult } | null => {
	const entry = resolveCache.get(messageId);
	if (entry?.done) {
		// Re-insert to move to the most-recent position.
		resolveCache.delete(messageId);
		resolveCache.set(messageId, entry);
		return { result: entry.result };
	}
	return null;
};

/**
 * Resolves a single assistant message through the rendering pipeline.
 *
 * The `renderers` array is executed in order — Custom-type renderers always
 * run first regardless of position, then the rest in order.
 * The first renderer to return a non-undefined result (HTML string or React node) wins.
 * Defaults to `defaultMessageRenderers` (template → adaptive card → dynamic UI).
 *
 * Results are cached by message ID.
 */
export const resolveMessage = (
	message: IChatMessage,
	service?: IAIAssistantService,
	model?: string,
	theme?: "light" | "dark",
	settings?: IAIAssistantSettings,
	renderers?: IMessageRenderer[],
): Promise<RenderResult> => {
	if (message.role !== "assistant") return Promise.resolve(undefined);

	const existing = resolveCache.get(message.id);
	if (existing) {
		// LRU promote.
		resolveCache.delete(message.id);
		resolveCache.set(message.id, existing);
		return existing.promise;
	}

	const promise = resolveMessageImpl(
		message,
		service,
		model,
		theme,
		settings,
		renderers,
	);
	const entry = {
		promise,
		done: false,
		result: undefined as RenderResult,
	};
	resolveCache.set(message.id, entry);
	evictOldestEntries();
	promise
		.then((result) => {
			entry.done = true;
			entry.result = result;
		})
		.catch(() => {
			entry.done = true;
			entry.result = undefined;
		});
	return promise;
};

/**
 * Builds the final renderer chain.
 *
 * - If `renderers` is provided, only those renderers are used.
 * - If `renderers` is undefined, `defaultMessageRenderers` is used.
 * - Custom-type renderers always run first, preserving relative order.
 * - Built-in renderers are filtered by the `enabledRenderers` settings map.
 * - Built-in renderer order is overridden by `rendererOrder` from settings
 *   when provided. Renderers not listed in `rendererOrder` keep their
 *   original relative order at the end of the chain.
 */
const buildRendererChain = (
	renderers: IMessageRenderer[] | undefined,
	enabledRenderers: Record<string, boolean>,
	rendererOrder?: string[],
): IMessageRenderer[] => {
	const source = renderers ?? defaultMessageRenderers;
	const custom: IMessageRenderer[] = [];
	const builtIn: IMessageRenderer[] = [];

	for (const r of source) {
		if (r.type === MessageRendererType.Custom) {
			custom.push(r);
		} else {
			const enabled =
				enabledRenderers[r.type] ?? DEFAULT_ENABLED_RENDERERS[r.type] ?? true;
			if (enabled) builtIn.push(r);
		}
	}

	let ordered = builtIn;
	if (rendererOrder && rendererOrder.length > 0) {
		const indexOf = (type: string) => {
			const i = rendererOrder.indexOf(type);
			return i === -1 ? Number.MAX_SAFE_INTEGER : i;
		};
		ordered = [...builtIn].sort((a, b) => indexOf(a.type) - indexOf(b.type));
	}

	return [...custom, ...ordered];
};

const resolveMessageImpl = async (
	message: IChatMessage,
	service?: IAIAssistantService,
	model?: string,
	theme?: "light" | "dark",
	settings?: IAIAssistantSettings,
	renderers?: IMessageRenderer[],
): Promise<RenderResult> => {
	const effectiveSettings = settings ?? DEFAULT_SETTINGS;
	const chain = buildRendererChain(
		renderers,
		effectiveSettings.enabledRenderers,
		effectiveSettings.rendererOrder,
	);
	const ctx = {
		message,
		service,
		theme: theme ?? "light",
		settings: effectiveSettings,
		model,
	};

	// Note: this runs once per message.id (cached) and must always complete.
	// React StrictMode double-mounts cause the first mount's cleanup to fire
	// before the chain finishes; if we observed an AbortSignal here, the
	// cached promise would resolve to undefined and the second mount would
	// see a permanent "no result". The hook layer (useResolveMessage) already
	// discards stale results via its `disposed` flag.
	for (const renderer of chain) {
		try {
			const result = await renderer.render(ctx);
			if (result !== undefined && result !== null) return result;
		} catch (err) {
			console.error(`[ai-assistant] Renderer "${renderer.type}" failed:`, err);
		}
	}

	return undefined;
};

// ---------------------------------------------------------------------------
// Friendly thread names
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
	"a",
	"about",
	"after",
	"again",
	"against",
	"all",
	"am",
	"an",
	"and",
	"any",
	"are",
	"as",
	"at",
	"be",
	"because",
	"been",
	"before",
	"being",
	"below",
	"between",
	"both",
	"but",
	"by",
	"can",
	"could",
	"did",
	"do",
	"does",
	"doing",
	"down",
	"during",
	"each",
	"few",
	"for",
	"from",
	"further",
	"get",
	"had",
	"has",
	"have",
	"having",
	"he",
	"her",
	"here",
	"hers",
	"herself",
	"him",
	"himself",
	"his",
	"how",
	"i",
	"if",
	"in",
	"into",
	"is",
	"it",
	"its",
	"itself",
	"just",
	"me",
	"more",
	"most",
	"my",
	"myself",
	"need",
	"no",
	"nor",
	"not",
	"now",
	"of",
	"off",
	"on",
	"once",
	"only",
	"or",
	"other",
	"our",
	"ours",
	"ourselves",
	"out",
	"over",
	"own",
	"please",
	"same",
	"she",
	"should",
	"so",
	"some",
	"such",
	"than",
	"that",
	"the",
	"their",
	"theirs",
	"them",
	"themselves",
	"then",
	"there",
	"these",
	"they",
	"this",
	"those",
	"through",
	"to",
	"too",
	"under",
	"until",
	"up",
	"very",
	"want",
	"was",
	"we",
	"were",
	"what",
	"when",
	"where",
	"which",
	"while",
	"who",
	"whom",
	"why",
	"will",
	"with",
	"would",
	"you",
	"your",
	"yours",
	"yourself",
	"yourselves",
]);

const titleCase = (word: string): string =>
	word.length === 0
		? word
		: word[0].toUpperCase() + word.slice(1).toLowerCase();

/**
 * Derives a short, human-friendly name from chat content (e.g. the first
 * user message). Strips stop-words, picks up to 4 meaningful tokens, and
 * title-cases them. Falls back to "New Chat" when no usable text is given.
 *
 * Examples:
 *   "How do I add a hook to React?"       → "Add Hook React"
 *   "Generate weekly status report"       → "Generate Weekly Status Report"
 *   ""                                    → "New Chat"
 */
export const friendlyThreadName = (text: string | undefined | null): string => {
	if (!text) return "New Chat";
	const tokens = text
		.replace(/[`*_~>#]/g, " ")
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
	const meaningful = tokens.filter(
		(t) => t.length > 1 && !STOP_WORDS.has(t.toLowerCase()),
	);
	const picked = (meaningful.length > 0 ? meaningful : tokens).slice(0, 4);
	if (picked.length === 0) return "New Chat";
	return picked.map(titleCase).join(" ");
};
