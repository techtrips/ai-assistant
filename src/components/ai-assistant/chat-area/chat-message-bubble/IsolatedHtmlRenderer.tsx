import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef } from "react";

type IsolatedHtmlRendererProps = {
	html: string;
	className?: string;
	theme?: "light" | "dark";
	/**
	 * If true, the HTML is rendered verbatim without sanitization. Use only
	 * for fully trusted content (e.g. server-rendered templates). Defaults
	 * to false — DOMPurify strips scripts, event handlers and other vectors.
	 */
	trusted?: boolean;
};

const buildThemeStylesheet = (theme: "light" | "dark"): string => {
	const vars =
		theme === "dark"
			? {
					bg: "#1e1e1e",
					fg: "#e0e0e0",
					muted: "#a0a0a0",
					surface: "#2d2d2d",
					border: "#404040",
					accent: "#4ea8f0",
				}
			: {
					bg: "#ffffff",
					fg: "#333333",
					muted: "#6b6b6b",
					surface: "#f5f5f5",
					border: "#e0e0e0",
					accent: "#0078d4",
				};

	return `<style data-theme-base>
:host {
  color-scheme: ${theme};
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: ${vars.fg};
  background: transparent;
  -webkit-font-smoothing: antialiased;
}
:host * { box-sizing: border-box; }
a { color: ${vars.accent}; }
table { border-collapse: collapse; width: 100%; }
th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid ${vars.border}; }
th { font-weight: 600; color: ${vars.muted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; }
</style>`;
};

// Memoize sanitized output keyed by raw HTML so theme toggles / unrelated
// re-renders don't re-run DOMPurify.
const useSanitized = (html: string, trusted: boolean): string =>
	useMemo(() => {
		if (trusted) return html;
		return DOMPurify.sanitize(html, {
			USE_PROFILES: { html: true },
			ADD_ATTR: ["target", "rel"],
		});
	}, [html, trusted]);

export const IsolatedHtmlRenderer = ({
	html,
	className,
	theme = "light",
	trusted = false,
}: IsolatedHtmlRendererProps) => {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const safeHtml = useSanitized(html, trusted);
	const stylesheet = useMemo(() => buildThemeStylesheet(theme), [theme]);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
		shadowRoot.innerHTML = stylesheet + safeHtml;
	}, [safeHtml, stylesheet]);

	return <div ref={hostRef} className={className} />;
};
