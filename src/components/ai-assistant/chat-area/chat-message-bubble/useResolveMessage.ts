import { useEffect, useRef, useState } from "react";
import type { IChatMessage } from "../../AIAssistant.types";
import type { IAIAssistantService } from "../../AIAssistant.services";
import {
	resolveMessage,
	needsResolution,
	getResolvedFromCache,
} from "../../AIAssistant.utils";

export interface IUseResolveMessageResult {
	resolvedHtml: string | undefined;
	isLoading: boolean;
}

export const useResolveMessage = (
	message: IChatMessage,
	service: IAIAssistantService | undefined,
	hasCustomRenderer: boolean,
): IUseResolveMessageResult => {
	const skip = hasCustomRenderer || !needsResolution(message) || !service;

	// Read synchronously from the module-level cache — if already resolved
	// (e.g. StrictMode remount), we skip the loading state entirely.
	const cached = skip ? null : getResolvedFromCache(message.id);

	const [result, setResult] = useState<{ html: string | undefined } | null>(
		cached,
	);

	// Derived — no state timing issues
	const isLoading = !skip && result === null;

	const serviceRef = useRef(service);
	serviceRef.current = service;

	useEffect(() => {
		if (skip) return;

		const cached = getResolvedFromCache(message.id);
		if (cached) {
			setResult(cached);
			return;
		}

		const svc = serviceRef.current!;
		let disposed = false;

		resolveMessage(message, svc)
			.then((html) => {
				if (!disposed) setResult({ html });
			})
			.catch(() => {
				if (!disposed) setResult({ html: undefined });
			});

		return () => {
			disposed = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [message.id, skip]);

	return { resolvedHtml: result?.html, isLoading };
};
