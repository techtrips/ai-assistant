import { useEffect, useRef } from "react";

type IsolatedHtmlRendererProps = {
	html: string;
	className?: string;
};

export const IsolatedHtmlRenderer = ({
	html,
	className,
}: IsolatedHtmlRendererProps) => {
	const hostRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const host = hostRef.current;

		if (!host) {
			return;
		}

		const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
		shadowRoot.innerHTML = html;
	}, [html]);

	return <div ref={hostRef} className={className} />;
};
