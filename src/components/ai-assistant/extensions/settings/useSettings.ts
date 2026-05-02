import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import type { IAIAssistantSettings } from "../../AIAssistant.types";
import {
	AIAssistantPermission,
	DEFAULT_ENABLED_RENDERERS,
	DEFAULT_SETTINGS,
} from "../../AIAssistant.types";
import { checkPermission } from "../../AIAssistant.utils";

export const useSettings = () => {
	const {
		service,
		permissions,
		configuredExtensions,
		configuredRendererTypes,
		updateSettings,
	} = useAIAssistantContext();
	const [userSettings, setUserSettings] =
		useState<Partial<IAIAssistantSettings>>(DEFAULT_SETTINGS);
	const [globalSettings, setGlobalSettings] = useState<
		Partial<IAIAssistantSettings>
	>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const isAdmin = checkPermission(
		permissions,
		AIAssistantPermission.ManageSettings,
	);

	useEffect(() => {
		if (!service) {
			setLoading(false);
			return;
		}
		let ignore = false;

		Promise.all([
			service.getUserSettings().catch(() => ({ data: undefined })),
			isAdmin
				? service.getGlobalSettings().catch(() => ({ data: undefined }))
				: Promise.resolve({ data: {} }),
		]).then(([userResult, globalResult]) => {
			if (ignore) return;
			if (userResult.data)
				setUserSettings({ ...DEFAULT_SETTINGS, ...userResult.data });
			if (globalResult.data) setGlobalSettings(globalResult.data);
			setLoading(false);
		});

		return () => {
			ignore = true;
		};
	}, [service, isAdmin]);

	const debouncedSaveGlobal = useCallback(
		(next: Partial<IAIAssistantSettings>) => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
			setSaving(true);
			saveTimerRef.current = setTimeout(() => {
				service?.saveGlobalSettings(next).finally(() => setSaving(false));
			}, 500);
		},
		[service],
	);

	const saveUserSetting = useCallback(
		(key: keyof IAIAssistantSettings, value: boolean) => {
			const next = { ...userSettings, [key]: value };
			setUserSettings(next);
			updateSettings(next, globalSettings);

			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
			setSaving(true);
			saveTimerRef.current = setTimeout(() => {
				service?.saveUserSettings(next).finally(() => setSaving(false));
			}, 500);
		},
		[service, userSettings, globalSettings, updateSettings],
	);

	const saveGlobalSetting = useCallback(
		(key: keyof IAIAssistantSettings, value: boolean) => {
			const next = { ...globalSettings, [key]: value };
			setGlobalSettings(next);
			updateSettings(userSettings, next);
			debouncedSaveGlobal(next);
		},
		[userSettings, globalSettings, updateSettings, debouncedSaveGlobal],
	);

	const setRendererEnabled = useCallback(
		(rendererType: string, enabled: boolean) => {
			const current =
				globalSettings.enabledRenderers ?? DEFAULT_ENABLED_RENDERERS;
			const nextRenderers = { ...current, [rendererType]: enabled };
			const next = { ...globalSettings, enabledRenderers: nextRenderers };
			setGlobalSettings(next);
			updateSettings(userSettings, next);
			debouncedSaveGlobal(next);
		},
		[userSettings, globalSettings, updateSettings, debouncedSaveGlobal],
	);

	const setExtensionEnabled = useCallback(
		(key: string, enabled: boolean) => {
			const current = globalSettings.enabledExtensions ?? {};
			const nextMap = { ...current, [key]: enabled };
			const next = { ...globalSettings, enabledExtensions: nextMap };
			setGlobalSettings(next);
			updateSettings(userSettings, next);
			debouncedSaveGlobal(next);
		},
		[userSettings, globalSettings, updateSettings, debouncedSaveGlobal],
	);

	const setRendererOrder = useCallback(
		(order: string[]) => {
			const next = { ...globalSettings, rendererOrder: order };
			setGlobalSettings(next);
			updateSettings(userSettings, next);
			debouncedSaveGlobal(next);
		},
		[userSettings, globalSettings, updateSettings, debouncedSaveGlobal],
	);

	// Renderer types to show in the order UI — union of types from the active
	// chain plus any saved order entries that no longer match (so admins can
	// see/clean stale entries).
	const orderedRendererTypes = useMemo(() => {
		const saved = globalSettings.rendererOrder ?? [];
		const available = new Set(configuredRendererTypes);
		const result: string[] = [];
		for (const t of saved) {
			if (available.has(t) && !result.includes(t)) result.push(t);
		}
		for (const t of configuredRendererTypes) {
			if (!result.includes(t)) result.push(t);
		}
		return result;
	}, [configuredRendererTypes, globalSettings.rendererOrder]);

	return {
		userSettings,
		globalSettings,
		loading,
		saving,
		isAdmin,
		configuredExtensions,
		orderedRendererTypes,
		saveUserSetting,
		saveGlobalSetting,
		setRendererEnabled,
		setExtensionEnabled,
		setRendererOrder,
	};
};
