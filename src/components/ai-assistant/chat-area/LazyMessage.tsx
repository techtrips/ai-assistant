import { useEffect, useRef, useState } from "react";

interface LazyMessageProps {
	/** Estimated height for the placeholder before content is rendered */
	estimatedHeight?: number;
	/** If true, skip lazy loading and render immediately */
	eager?: boolean;
	/** Optional class for the wrapper div */
	className?: string;
	children: React.ReactNode;
}

/**
 * Renders children only when the wrapper scrolls into the viewport.
 * Once rendered, children stay mounted (no unmounting on scroll away)
 * so that resolved templates, Shadow DOM content, and component state
 * are preserved.
 *
 * If `eager` is true, children render immediately without waiting
 * for the IntersectionObserver (used for the most recent messages
 * that are visible at the bottom).
 */
export const LazyMessage = ({
	estimatedHeight = 120,
	eager = false,
	className,
	children,
}: LazyMessageProps) => {
	const [isVisible, setIsVisible] = useState(eager);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (eager) {
			setIsVisible(true);
			return;
		}

		const el = ref.current;
		if (!el || isVisible) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "200px 0px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [isVisible, eager]);

	return (
		<div ref={ref} className={className}>
			{isVisible ? children : <div style={{ height: estimatedHeight }} />}
		</div>
	);
};
