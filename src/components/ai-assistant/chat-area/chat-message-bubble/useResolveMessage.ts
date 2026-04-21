import { useEffect, useRef, useState } from "react";
import type { IAIAssistantService } from "../../AIAssistant.services";
import type {
	IAIAssistantSettings,
	IChatMessage,
} from "../../AIAssistant.types";
import {
	getResolvedFromCache,
	needsResolution,
	resolveMessage,
} from "../../AIAssistant.utils";
import type { IMessageRenderer, RenderResult } from "../../messageRenderers";

export interface IUseResolveMessageResult {
	resolved: RenderResult;
	isLoading: boolean;
}

export const useResolveMessage = (
	message: IChatMessage,
	service: IAIAssistantService | undefined,
	theme?: "light" | "dark",
	settings?: IAIAssistantSettings,
	renderers?: IMessageRenderer[],
): IUseResolveMessageResult => {
	const skip = !needsResolution(message);

	// Read synchronously from the module-level cache — if already resolved
	// (e.g. StrictMode remount), we skip the loading state entirely.
	const cached = skip ? null : getResolvedFromCache(message.id);

	const [result, setResult] = useState<{ result: RenderResult } | null>(cached);

	// Derived — no state timing issues
	const isLoading = !skip && result === null;

	const serviceRef = useRef(service);
	serviceRef.current = service;

	// biome-ignore lint/correctness/useExhaustiveDependencies: message tracked by message.id
	useEffect(() => {
		if (skip) return;

		const cached = getResolvedFromCache(message.id);
		if (cached) {
			setResult(cached);
			return;
		}

		let disposed = false;

		resolveMessage(
			message,
			serviceRef.current,
			undefined,
			theme,
			settings,
			renderers,
		)
			.then((resolved) => {
				if (!disposed) setResult({ result: resolved });
			})
			.catch(() => {
				if (!disposed) setResult({ result: undefined });
			});

		return () => {
			disposed = true;
		};
	}, [message.id, skip]);

	return { resolved: result?.result, isLoading };
};
