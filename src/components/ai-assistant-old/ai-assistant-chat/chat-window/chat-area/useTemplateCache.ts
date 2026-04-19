import { useCallback, useMemo, useRef } from "react";
import type { IResolvedTemplate } from "../../../AIAssistant.models";

export interface IUseTemplateCacheResult {
	get: (messageId: string) => IResolvedTemplate | undefined;
	onResolved: (messageId: string, result: IResolvedTemplate) => void;
	clear: () => void;
}

export const useTemplateCache = (): IUseTemplateCacheResult => {
	const cacheRef = useRef(new Map<string, IResolvedTemplate>());

	const get = useCallback(
		(messageId: string) => cacheRef.current.get(messageId),
		[],
	);

	const onResolved = useCallback(
		(messageId: string, result: IResolvedTemplate) => {
			cacheRef.current.set(messageId, result);
		},
		[],
	);

	const clear = useCallback(() => {
		cacheRef.current.clear();
	}, []);

	return useMemo(() => ({ get, onResolved, clear }), [get, onResolved, clear]);
};
