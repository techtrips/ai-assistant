import { useCallback, useEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 50;

export const useAutoScroll = (messageCount: number, isStreaming = false) => {
	const elRef = useRef<HTMLDivElement | null>(null);
	const lockedRef = useRef(true);
	const streamingRef = useRef(isStreaming);
	const roRef = useRef<ResizeObserver | null>(null);
	const moRef = useRef<MutationObserver | null>(null);

	streamingRef.current = isStreaming;

	const isAtBottom = (el: HTMLDivElement) =>
		el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;

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

	const scrollRef = useCallback((el: HTMLDivElement | null) => {
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

		el.addEventListener(
			"scroll",
			() => {
				if (!streamingRef.current) {
					lockedRef.current = isAtBottom(el);
				}
			},
			{ passive: true },
		);

		const ro = new ResizeObserver(() => {
			if ((lockedRef.current || streamingRef.current) && elRef.current) {
				elRef.current.scrollTop = elRef.current.scrollHeight;
			}
		});
		ro.observe(el);
		Array.from(el.children).forEach((child) => {
			ro.observe(child);
			// Also observe grandchildren so resolved content inside
			// LazyMessage / Shadow DOM triggers scroll-to-bottom.
			Array.from(child.children).forEach((gc) => ro.observe(gc));
		});
		roRef.current = ro;

		const mo = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLElement && roRef.current) {
						roRef.current.observe(node);
						Array.from(node.children).forEach((gc) => {
							if (gc instanceof HTMLElement) roRef.current!.observe(gc);
						});
					}
				});
			}
			if ((lockedRef.current || streamingRef.current) && elRef.current) {
				elRef.current.scrollTop = elRef.current.scrollHeight;
			}
		});
		mo.observe(el, { childList: true, subtree: true, characterData: true });
		moRef.current = mo;
	}, []);

	useEffect(() => {
		lockedRef.current = true;
		doScroll();
	}, [messageCount, doScroll]);

	useEffect(() => {
		return () => {
			roRef.current?.disconnect();
			moRef.current?.disconnect();
		};
	}, []);

	return { scrollRef };
};
