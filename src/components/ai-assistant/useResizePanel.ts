import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const MIN_WIDTH = 280;
const MAX_WIDTH_RATIO = 0.7;

/** Pick a sensible default based on viewport width. */
const getDefaultWidth = () => {
	const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
	if (vw >= 1600) return 520;
	if (vw >= 1200) return 460;
	if (vw >= 900) return 400;
	return 360;
};

export function useResizePanel(isEnabled: boolean) {
	const [width, setWidth] = useState(getDefaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

	const onResizeStart = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (!isEnabled || event.button !== 0) return;
			resizeRef.current = { startX: event.clientX, startWidth: width };
			setIsResizing(true);
			event.preventDefault();
		},
		[isEnabled, width],
	);

	useEffect(() => {
		if (!isEnabled) {
			resizeRef.current = null;
			setIsResizing(false);
		}
	}, [isEnabled]);

	useEffect(() => {
		if (!isEnabled || !isResizing) return;

		const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;

		const handlePointerMove = (event: PointerEvent) => {
			const state = resizeRef.current;
			if (!state) return;
			const delta = state.startX - event.clientX;
			const next = Math.min(
				maxWidth,
				Math.max(MIN_WIDTH, state.startWidth + delta),
			);
			setWidth(next);
		};

		const stopResizing = () => {
			resizeRef.current = null;
			setIsResizing(false);
		};

		document.body.style.userSelect = "none";
		document.body.style.cursor = "col-resize";
		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", stopResizing);
		window.addEventListener("pointercancel", stopResizing);

		return () => {
			document.body.style.userSelect = "";
			document.body.style.cursor = "";
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", stopResizing);
			window.removeEventListener("pointercancel", stopResizing);
		};
	}, [isEnabled, isResizing]);

	return { width, isResizing, onResizeStart };
}
