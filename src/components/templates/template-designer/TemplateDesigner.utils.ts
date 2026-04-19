/**
 * Extracts all dot-path binding paths from a JSON object.
 *
 * Given `{ request: { title: "...", items: [{ name: "A", qty: 2 }] } }`
 * the output is:
 *   ["request", "request.title", "request.items", "request.items.name", "request.items.qty"]
 *
 * Arrays are traversed to discover child properties, but indices are omitted
 * from the path so bindings remain generic (e.g. `items.name` not `items.0.name`).
 */
export const extractBindingPaths = (obj: unknown): string[] => {
	const paths: Set<string> = new Set();

	const walk = (value: unknown, prefix: string) => {
		if (value === null || value === undefined) return;

		if (Array.isArray(value)) {
			// Add the array path itself (e.g. "lineItems")
			if (prefix) paths.add(prefix);
			// Walk into the first element to discover child keys
			if (value.length > 0) {
				walk(value[0], prefix);
			}
			return;
		}

		if (typeof value === "object") {
			if (prefix) paths.add(prefix);
			for (const key of Object.keys(value as Record<string, unknown>)) {
				const childPath = prefix ? `${prefix}.${key}` : key;
				walk((value as Record<string, unknown>)[key], childPath);
			}
			return;
		}

		// Leaf value (string, number, boolean)
		if (prefix) paths.add(prefix);
	};

	walk(obj, "");
	return Array.from(paths).sort();
};

/**
 * Converts a binding field path into a readable title.
 * Example: "requestStatus.displayName" -> "Display Name".
 */
export const toPrettyFieldLabel = (field?: string): string => {
	if (!field) return "New Tile";

	const leaf = field.split(".").pop() ?? field;
	const withSpaces = leaf
		.replace(/[_-]+/g, " ")
		.replace(/([a-z\d])([A-Z])/g, "$1 $2")
		.trim();

	if (!withSpaces) return "New Tile";

	return withSpaces
		.split(/\s+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
};

/**
 * Returns a stable tile key using explicit tile id when present,
 * otherwise falls back to index-based key.
 */
export const getSummaryTileKey = (
	tileId: string | undefined,
	idx: number,
): string => {
	return tileId ?? `tile${idx + 1}`;
};

// ---------------------------------------------------------------------------
// Template JSON validation
// ---------------------------------------------------------------------------

const VALID_CONTROL_TYPES = new Set([
	"field",
	"button",
	"table",
	"badge",
	"image",
	"progressBar",
	"inputField",
	"separator",
]);

/**
 * Validates that a parsed JSON object conforms to the ITemplate shape.
 * Returns `null` if valid, or an error message string if not.
 */
export const validateTemplateJson = (obj: unknown): string | null => {
	if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
		return "Root must be a JSON object.";
	}

	const t = obj as Record<string, unknown>;

	if (typeof t.id !== "string" || !t.id) {
		return 'Missing or invalid "id" (must be a non-empty string).';
	}
	if (typeof t.name !== "string" || !t.name) {
		return 'Missing or invalid "name" (must be a non-empty string).';
	}
	if (typeof t.version !== "string" || !t.version) {
		return 'Missing or invalid "version" (must be a non-empty string).';
	}
	if (t.card == null || typeof t.card !== "object" || Array.isArray(t.card)) {
		return 'Missing or invalid "card" (must be an object).';
	}

	const card = t.card as Record<string, unknown>;
	if (card.title == null) {
		return 'Card is missing a "title" property.';
	}

	// Validate sections if present
	if (card.sections != null) {
		if (!Array.isArray(card.sections)) {
			return 'Card "sections" must be an array.';
		}
		for (let i = 0; i < card.sections.length; i++) {
			const err = validateSection(card.sections[i], `card.sections[${i}]`);
			if (err) return err;
		}
	}

	// Validate card-level children if present
	if (card.children != null) {
		if (!Array.isArray(card.children)) {
			return 'Card "children" must be an array.';
		}
		for (let i = 0; i < card.children.length; i++) {
			const err = validateControl(card.children[i], `card.children[${i}]`);
			if (err) return err;
		}
	}

	return null;
};

function validateSection(obj: unknown, path: string): string | null {
	if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
		return `${path}: must be an object.`;
	}
	const s = obj as Record<string, unknown>;
	if (typeof s.id !== "string" || !s.id) {
		return `${path}: missing or invalid "id".`;
	}
	if (s.label == null) {
		return `${path}: missing "label".`;
	}
	if (s.children != null) {
		if (!Array.isArray(s.children)) {
			return `${path}.children: must be an array.`;
		}
		for (let i = 0; i < s.children.length; i++) {
			const err = validateControl(s.children[i], `${path}.children[${i}]`);
			if (err) return err;
		}
	}
	if (s.subsections != null) {
		if (!Array.isArray(s.subsections)) {
			return `${path}.subsections: must be an array.`;
		}
		for (let i = 0; i < s.subsections.length; i++) {
			const err = validateSection(
				s.subsections[i],
				`${path}.subsections[${i}]`,
			);
			if (err) return err;
		}
	}
	return null;
}

function validateControl(obj: unknown, path: string): string | null {
	if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
		return `${path}: must be an object.`;
	}
	const c = obj as Record<string, unknown>;
	if (typeof c.id !== "string" || !c.id) {
		return `${path}: missing or invalid "id".`;
	}
	if (typeof c.type !== "string" || !VALID_CONTROL_TYPES.has(c.type)) {
		return `${path}: invalid "type" ("${String(c.type)}"). Must be one of: ${[...VALID_CONTROL_TYPES].join(", ")}.`;
	}
	return null;
}
