import { useEffect, useMemo, useRef, useState } from "react";
import type { IResolvedTemplate } from "../../../../AIAssistant.models";
import {
	extractCustomPrompt,
	extractTemplateEntries,
} from "../../../../AIAssistant.utils";
import type {
	IUseResolveTemplateOptions,
	IUseResolveTemplateResult,
} from "./MessageRenderer.models";

export const useResolveTemplate = ({
	messageId,
	payload,
	userMessageText,
	resolveTemplate,
	skip,
	cachedResolved,
	onResolved,
}: IUseResolveTemplateOptions): IUseResolveTemplateResult => {
	const [resolved, setResolved] = useState<IResolvedTemplate | undefined>(
		cachedResolved,
	);
	const [isLoading, setIsLoading] = useState(false);

	// Keep function props in refs so they don't trigger the resolution effect
	const resolveTemplateRef = useRef(resolveTemplate);
	resolveTemplateRef.current = resolveTemplate;
	const onResolvedRef = useRef(onResolved);
	onResolvedRef.current = onResolved;

	const templateInfo = useMemo(() => {
		const entries = extractTemplateEntries(payload);
		return entries.length > 0 ? entries[0] : undefined;
	}, [payload]);

	const customPrompt = useMemo(() => extractCustomPrompt(payload), [payload]);

	// If cached, use it directly — no effect needed
	useEffect(() => {
		if (cachedResolved) {
			setResolved(cachedResolved);
			setIsLoading(false);
		}
	}, [cachedResolved]);

	// Run the async resolution only once per unique message
	useEffect(() => {
		if (skip || cachedResolved || !resolveTemplateRef.current) {
			if (skip) {
				setResolved(undefined);
				setIsLoading(false);
			}
			return;
		}

		let disposed = false;
		const abortController = new AbortController();
		setIsLoading(true);

		void resolveTemplateRef
			.current(
				templateInfo,
				userMessageText,
				payload,
				customPrompt,
				abortController.signal,
			)
			.then((result) => {
				if (!disposed) {
					setResolved(result);
					if (result && messageId && onResolvedRef.current) {
						onResolvedRef.current(messageId, result);
					}
				}
			})
			.catch((error) => {
				if (!abortController.signal.aborted) {
					console.error("[AIAssistant] Failed to resolve template.", error);
				}
			})
			.finally(() => {
				if (!disposed) setIsLoading(false);
			});

		return () => {
			disposed = true;
			abortController.abort();
		};
		// Only re-run when the actual data changes, not function references
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [customPrompt, messageId, payload, skip, templateInfo, userMessageText]);

	const templateData = templateInfo?.data ?? ({} as Record<string, unknown>);

	return { resolved, isLoading, templateData };
};
