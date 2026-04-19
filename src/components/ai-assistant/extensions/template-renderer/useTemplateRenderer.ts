import { useCallback, useEffect, useMemo, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import { AIAssistantPermission } from "../../AIAssistant.types";
import { checkPermission } from "../../AIAssistant.utils";
import type { ITemplate } from "../../AIAssistant.types";

export const useTemplateRenderer = () => {
	const { service, permissions } = useAIAssistantContext();
	const canManage = checkPermission(
		permissions,
		AIAssistantPermission.ManageTemplates,
	);

	const [templates, setTemplates] = useState<ITemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState("");

	const [panelTarget, setPanelTarget] = useState<ITemplate | null | undefined>(
		null,
	);
	const [saving, setSaving] = useState(false);
	const [panelError, setPanelError] = useState("");

	const [deleteTarget, setDeleteTarget] = useState<ITemplate | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	const availableAgents = useMemo(() => {
		const names = new Set<string>();
		for (const t of templates) {
			for (const a of t.agents) {
				if (a.trim()) names.add(a.trim());
			}
		}
		return Array.from(names);
	}, [templates]);

	useEffect(() => {
		if (!service) {
			setLoading(false);
			return;
		}
		service.getTemplates().then((result) => {
			if (result.data) setTemplates(result.data);
			if (result.error) setError(result.error);
			setLoading(false);
		});
	}, [service]);

	const filtered = useMemo(() => {
		if (!searchQuery.trim()) return templates;
		const q = searchQuery.toLowerCase();
		return templates.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				(t.description?.toLowerCase().includes(q) ?? false) ||
				t.agents.some((a) => a.toLowerCase().includes(q)),
		);
	}, [templates, searchQuery]);

	const handleSave = useCallback(
		async (template: ITemplate) => {
			if (!service) return;
			setSaving(true);
			setPanelError("");
			try {
				if (template.id) {
					const result = await service.updateTemplate(template);
					if (result.error) throw new Error(result.error);
					setTemplates((prev) =>
						prev.map((t) =>
							t.id === template.id ? (result.data ?? template) : t,
						),
					);
				} else {
					const result = await service.addTemplate(template);
					if (result.error) throw new Error(result.error);
					if (result.data) setTemplates((prev) => [...prev, result.data!]);
				}
				setPanelTarget(null);
			} catch (err) {
				setPanelError(err instanceof Error ? err.message : "Failed to save.");
			} finally {
				setSaving(false);
			}
		},
		[service],
	);

	const handleDelete = useCallback(async () => {
		if (!service || !deleteTarget?.id) return;
		setDeleting(true);
		setDeleteError("");
		try {
			const result = await service.deleteTemplate(deleteTarget.id);
			if (result.error) throw new Error(result.error);
			setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
			setDeleteTarget(null);
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : "Failed to delete.");
		} finally {
			setDeleting(false);
		}
	}, [service, deleteTarget]);

	const openCreatePanel = useCallback(() => {
		setPanelError("");
		setPanelTarget(undefined);
	}, []);

	const openEditPanel = useCallback((template: ITemplate) => {
		setPanelError("");
		setPanelTarget(template);
	}, []);

	const closePanel = useCallback(() => {
		setPanelTarget(null);
	}, []);

	const openDeleteDialog = useCallback((template: ITemplate) => {
		setDeleteError("");
		setDeleteTarget(template);
	}, []);

	const closeDeleteDialog = useCallback(() => {
		setDeleteTarget(null);
	}, []);

	return {
		service,
		canManage,
		templates,
		filtered,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		availableAgents,
		panelTarget,
		saving,
		panelError,
		deleteTarget,
		deleting,
		deleteError,
		handleSave,
		handleDelete,
		openCreatePanel,
		openEditPanel,
		closePanel,
		openDeleteDialog,
		closeDeleteDialog,
	};
};
