import { useCallback, useEffect, useRef, useState } from "react";
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
		agentNames: contextAgentNames,
		updateSettings,
	} = useAIAssistantContext();
	const [userSettings, setUserSettings] =
		useState<Partial<IAIAssistantSettings>>(DEFAULT_SETTINGS);
	const [globalSettings, setGlobalSettings] = useState<
		Partial<IAIAssistantSettings>
	>({});
	const [allAgentNames, setAllAgentNames] = useState<string[]>([]);
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
			service.getAgentNames().catch(() => ({ data: undefined })),
		]).then(([userResult, globalResult, agentsResult]) => {
			if (ignore) return;
			if (userResult.data)
				setUserSettings({ ...DEFAULT_SETTINGS, ...userResult.data });
			if (globalResult.data) setGlobalSettings(globalResult.data);
			if (agentsResult.data) setAllAgentNames(agentsResult.data);
			setLoading(false);
		});

		return () => {
			ignore = true;
		};
	}, [service, isAdmin]);

	// Use context agent names as fallback if service.getAgentNames() didn't return any
	const effectiveAgentNames =
		allAgentNames.length > 0 ? allAgentNames : contextAgentNames;

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

	const setVisibleAgents = useCallback(
		(agents: string[]) => {
			const next = { ...globalSettings, visibleAgents: agents };
			setGlobalSettings(next);
			updateSettings(userSettings, next);
			debouncedSaveGlobal(next);
		},
		[userSettings, globalSettings, updateSettings, debouncedSaveGlobal],
	);

	return {
		userSettings,
		globalSettings,
		loading,
		saving,
		isAdmin,
		allAgentNames: effectiveAgentNames,
		saveUserSetting,
		saveGlobalSetting,
		setRendererEnabled,
		setVisibleAgents,
	};
};
