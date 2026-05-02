import DOMPurify from "dompurify";
import { marked } from "marked";
import { useMemo } from "react";

interface IStreamingMarkdownProps {
	text: string;
	className?: string;
}

/**
 * Live-renders streaming markdown into safe HTML so the user sees
 * formatted output (lists, bold, links, code blocks) appearing as the
 * text streams in — instead of raw markdown that suddenly re-formats
 * once the run finishes.
 *
 * Tolerant of partial input: marked() will leave unfinished fences /
 * tags as-is, and we re-parse on every chunk.
 */
export const StreamingMarkdown = ({
	text,
	className,
}: IStreamingMarkdownProps) => {
	const html = useMemo(() => {
		if (!text) return "";
		try {
			const raw = marked.parse(text, {
				async: false,
				breaks: true,
				gfm: true,
			}) as string;
			const safe = DOMPurify.sanitize(raw, {
				USE_PROFILES: { html: true },
				ADD_ATTR: ["target", "rel"],
			});
			return safe.replace(
				/<a\s+(?![^>]*\btarget=)/gi,
				'<a target="_blank" rel="noopener noreferrer" ',
			);
		} catch {
			return text;
		}
	}, [text]);

	return (
		<div
			className={className}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify above
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
