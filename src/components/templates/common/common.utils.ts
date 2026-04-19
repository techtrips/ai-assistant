import type { ControlValue, IControlStyle } from "../templates.models";

export function formatValue(raw: ControlValue, format?: string): string {
	if (raw == null) return "—";
	if (typeof raw === "boolean") return raw ? "Yes" : "No";

	switch (format) {
		case "date":
			return new Date(String(raw)).toLocaleDateString();
		case "currency":
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(Number(raw));
		case "number":
			return new Intl.NumberFormat("en-US").format(Number(raw));
		default:
			return String(raw);
	}
}

/**
 * Convert an IControlStyle object to a React CSSProperties object.
 * Returns `undefined` when the style is empty or absent so that components
 * can skip the inline style attribute altogether.
 */
export function toReactStyle(
	style?: IControlStyle,
): React.CSSProperties | undefined {
	if (!style || Object.keys(style).length === 0) return undefined;
	// IControlStyle keys are a strict subset of CSSProperties.
	return style as React.CSSProperties;
}

/**
 * Extract text-related style properties (color, fontSize, fontWeight,
 * textAlign) that must be applied directly on text-bearing child elements
 * rather than a wrapper div. Griffel sets these explicitly on child spans,
 * so inheriting from a parent div is not enough — inline style on the
 * child is required to override.
 */
const TEXT_STYLE_KEYS: (keyof IControlStyle)[] = [
	"color",
	"fontSize",
	"fontWeight",
	"textAlign",
];

export function toTextStyle(
	style?: IControlStyle,
): React.CSSProperties | undefined {
	if (!style) return undefined;
	const result: Record<string, unknown> = {};
	for (const key of TEXT_STYLE_KEYS) {
		if (style[key] !== undefined) {
			result[key] = style[key];
		}
	}
	return Object.keys(result).length > 0
		? (result as React.CSSProperties)
		: undefined;
}
