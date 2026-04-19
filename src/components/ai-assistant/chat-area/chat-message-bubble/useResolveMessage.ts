import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { IAIAssistantService } from "../../AIAssistant.services";
import type { IChatMessage } from "../../AIAssistant.types";
import {
	getResolvedFromCache,
	needsResolution,
	resolveMessage,
} from "../../AIAssistant.utils";

export interface IUseResolveMessageResult {
	resolvedHtml: string | undefined;
	isLoading: boolean;
}

export const useResolveMessage = (
	message: IChatMessage,
	service: IAIAssistantService | undefined,
	renderMessage?: (message: IChatMessage) => ReactNode,
): IUseResolveMessageResult => {
	const skip = !needsResolution(message) || !service;

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: message tracked by message.id; renderMessage is a stable prop callback
	useEffect(() => {
		if (skip) return;

		const cached = getResolvedFromCache(message.id);
		if (cached) {
			setResult(cached);
			return;
		}

		// biome-ignore lint/style/noNonNullAssertion: guarded by skip check above
		const svc = serviceRef.current!;
		let disposed = false;

		resolveMessage(message, svc, undefined, renderMessage)
			.then((html) => {
				if (!disposed) setResult({ html });
			})
			.catch(() => {
				if (!disposed) setResult({ html: undefined });
			});

		return () => {
			disposed = true;
		};
	}, [message.id, skip]);

	return { resolvedHtml: result?.html, isLoading };
};
