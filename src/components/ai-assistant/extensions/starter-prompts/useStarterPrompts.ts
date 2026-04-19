import { useCallback, useEffect, useMemo, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import { AIAssistantPermission } from "../../AIAssistant.types";
import { checkPermission } from "../../AIAssistant.utils";
import type { IStarterPrompt } from "../../AIAssistant.types";

export const useStarterPrompts = () => {
	const { service, permissions, sendMessage, agentNames: contextAgentNames, refreshStarterPrompts } =
		useAIAssistantContext();
	const canManage = checkPermission(
		permissions,
		AIAssistantPermission.ManageStarterPrompts,
	);

	const [prompts, setPrompts] = useState<IStarterPrompt[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState("");

	const [panelTarget, setPanelTarget] = useState<
		IStarterPrompt | null | undefined
	>(null);
	const [saving, setSaving] = useState(false);
	const [panelError, setPanelError] = useState("");

	const [deleteTarget, setDeleteTarget] = useState<IStarterPrompt | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	const agentNames = useMemo(() => {
		const names = new Set<string>(contextAgentNames);
		for (const p of prompts) {
			if (p.agentName?.trim()) names.add(p.agentName.trim());
		}
		return Array.from(names);
	}, [prompts, contextAgentNames]);

	useEffect(() => {
		if (!service || contextAgentNames.length === 0) {
			setLoading(false);
			return;
		}
		service.getStarterPrompts(contextAgentNames).then((result) => {
			if (result.data) setPrompts(result.data);
			if (result.error) setError(result.error);
			setLoading(false);
		});
	}, [service, contextAgentNames]);

	const filtered = useMemo(() => {
		let list = prompts;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(p) =>
					p.title.toLowerCase().includes(q) ||
					(p.prompt ?? "").toLowerCase().includes(q) ||
					(p.agentName ?? "").toLowerCase().includes(q) ||
					(p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
			);
		}
		return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	}, [prompts, searchQuery]);

	const handleSave = useCallback(
		async (prompt: IStarterPrompt) => {
			if (!service) return;
			setSaving(true);
			setPanelError("");
			try {
				if (prompt.id) {
					const result = await service.updateStarterPrompt(prompt);
					if (result.error) throw new Error(result.error);
					setPrompts((prev) =>
						prev.map((p) => (p.id === prompt.id ? (result.data ?? prompt) : p)),
					);
				} else {
					const result = await service.addStarterPrompt(prompt);
					if (result.error) throw new Error(result.error);
					if (result.data) setPrompts((prev) => [...prev, result.data!]);
				}
				setPanelTarget(null);
				refreshStarterPrompts();
			} catch (err) {
				setPanelError(err instanceof Error ? err.message : "Failed to save.");
			} finally {
				setSaving(false);
			}
		},
		[service, refreshStarterPrompts],
	);

	const handleDelete = useCallback(async () => {
		if (!service || !deleteTarget?.id) return;
		setDeleting(true);
		setDeleteError("");
		try {
			const result = await service.deleteStarterPrompt(
				deleteTarget.id,
				deleteTarget.agentName,
			);
			if (result.error) throw new Error(result.error);
			setPrompts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
			setDeleteTarget(null);
			refreshStarterPrompts();
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : "Failed to delete.");
		} finally {
			setDeleting(false);
		}
	}, [service, deleteTarget]);

	const handleSelect = useCallback(
		(prompt: IStarterPrompt, onClose: () => void) => {
			if (prompt.prompt) {
				sendMessage(prompt.prompt);
				onClose();
			}
		},
		[sendMessage],
	);

	const openCreatePanel = useCallback(() => {
		setPanelError("");
		setPanelTarget(undefined);
	}, []);

	const openEditPanel = useCallback((prompt: IStarterPrompt) => {
		setPanelError("");
		setPanelTarget(prompt);
	}, []);

	const closePanel = useCallback(() => {
		setPanelTarget(null);
	}, []);

	const openDeleteDialog = useCallback((prompt: IStarterPrompt) => {
		setDeleteError("");
		setDeleteTarget(prompt);
	}, []);

	const closeDeleteDialog = useCallback(() => {
		setDeleteTarget(null);
	}, []);

	return {
		service,
		canManage,
		prompts,
		filtered,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		agentNames,
		panelTarget,
		saving,
		panelError,
		deleteTarget,
		deleting,
		deleteError,
		handleSave,
		handleDelete,
		handleSelect,
		openCreatePanel,
		openEditPanel,
		closePanel,
		openDeleteDialog,
		closeDeleteDialog,
	};
};
