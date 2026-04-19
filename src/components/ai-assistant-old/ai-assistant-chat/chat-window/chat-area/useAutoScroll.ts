import { useCallback, useEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 50;

export interface IUseAutoScrollResult {
	/** Callback ref — attach to the scrollable container */
	scrollRef: (el: HTMLDivElement | null) => void;
	/** Force scroll to bottom */
	scrollToBottom: () => void;
}

/**
 * Auto-scrolls a container to the bottom when:
 * 1. New messages arrive (messageCount changes)
 * 2. Content height changes while user is at/near bottom (template resolves, images load, etc.)
 *
 * Uses MutationObserver to detect new children and ResizeObserver to detect
 * height changes from async content (shadow DOM, resolved templates, etc.).
 *
 * Respects user intent: if user scrolls up, auto-scroll pauses.
 * Re-locks when messageCount changes or scrollToBottom is called.
 */
export const useAutoScroll = (messageCount: number): IUseAutoScrollResult => {
	const elRef = useRef<HTMLDivElement | null>(null);
	const lockedRef = useRef(true);
	const roRef = useRef<ResizeObserver | null>(null);
	const moRef = useRef<MutationObserver | null>(null);

	const isAtBottom = (el: HTMLDivElement) =>
		el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;

	// Double-rAF ensures scroll happens after layout is fully complete
	const doScroll = useCallback(() => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				const el = elRef.current;
				if (el) {
					el.scrollTop = el.scrollHeight;
				}
			});
		});
	}, []);

	const scrollToBottom = useCallback(() => {
		lockedRef.current = true;
		doScroll();
	}, [doScroll]);

	// Callback ref — set up observers
	const scrollRef = useCallback((el: HTMLDivElement | null) => {
		// Cleanup previous
		if (roRef.current) {
			roRef.current.disconnect();
			roRef.current = null;
		}
		if (moRef.current) {
			moRef.current.disconnect();
			moRef.current = null;
		}

		elRef.current = el;
		if (!el) return;

		// Track user scroll position
		el.addEventListener(
			"scroll",
			() => {
				lockedRef.current = isAtBottom(el);
			},
			{ passive: true },
		);

		// ResizeObserver — scroll when any observed element changes height
		const ro = new ResizeObserver(() => {
			if (lockedRef.current && elRef.current) {
				elRef.current.scrollTop = elRef.current.scrollHeight;
			}
		});
		ro.observe(el);
		Array.from(el.children).forEach((child) => ro.observe(child));
		roRef.current = ro;

		// MutationObserver — watch for new children (new messages)
		// and observe them with ResizeObserver for future height changes
		const mo = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLElement && roRef.current) {
						roRef.current.observe(node);
					}
				});
			}
			// Scroll after new children are added
			if (lockedRef.current && elRef.current) {
				elRef.current.scrollTop = elRef.current.scrollHeight;
			}
		});
		mo.observe(el, { childList: true });
		moRef.current = mo;
	}, []);

	// Re-lock and scroll when message count changes
	useEffect(() => {
		lockedRef.current = true;
		doScroll();
	}, [messageCount, doScroll]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			roRef.current?.disconnect();
			moRef.current?.disconnect();
		};
	}, []);

	return { scrollRef, scrollToBottom };
};
