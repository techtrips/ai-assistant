import { useEffect, useMemo, useRef, useState } from "react";

// DOMPurify is ~50kb gz; loaded on first sanitize.
type DomPurifyModule = typeof import("dompurify");
let dompurifyPromise: Promise<DomPurifyModule> | undefined;
const loadDomPurify = (): Promise<DomPurifyModule> => {
	if (!dompurifyPromise) dompurifyPromise = import("dompurify");
	return dompurifyPromise;
};

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

// Tiny per-renderer sanitization cache keyed by raw HTML. Memoization at
// the component level avoids re-sanitizing the same chat reply on every
// theme toggle / resize re-render.
const useSanitized = (html: string, trusted: boolean): string | undefined => {
	const cacheRef = useRef<{ key: string; out: string } | null>(null);
	const [out, setOut] = useState<string | undefined>(() =>
		trusted
			? html
			: cacheRef.current?.key === html
				? cacheRef.current.out
				: undefined,
	);

	useEffect(() => {
		if (trusted) {
			setOut(html);
			return;
		}
		if (cacheRef.current?.key === html) {
			setOut(cacheRef.current.out);
			return;
		}
		let cancelled = false;
		(async () => {
			const mod = await loadDomPurify();
			const purify = (mod.default ?? (mod as unknown as DomPurifyModule)) as {
				sanitize: (s: string, opts?: unknown) => string;
			};
			const safe = purify.sanitize(html, {
				USE_PROFILES: { html: true },
				ADD_ATTR: ["target", "rel"],
			});
			if (cancelled) return;
			cacheRef.current = { key: html, out: safe };
			setOut(safe);
		})();
		return () => {
			cancelled = true;
		};
	}, [html, trusted]);

	return out;
};

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
		if (!host || safeHtml === undefined) return;
		const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
		shadowRoot.innerHTML = stylesheet + safeHtml;
	}, [safeHtml, stylesheet]);

	return <div ref={hostRef} className={className} />;
};
