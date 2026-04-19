import { useCallback, useEffect, useMemo, useState } from "react";
import { useAIAssistantContext } from "../../AIAssistantContext";
import { AIAssistantPermission } from "../../AIAssistant.types";
import { checkPermission } from "../../AIAssistant.utils";
import type { ITemplate } from "../../AIAssistant.types";
import type { ITemplate as IDesignerTemplate } from "../../../templates/templates.models";

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

	const [agentNames, setAgentNames] = useState<string[]>([]);

	const [designTarget, setDesignTarget] = useState<ITemplate | null>(null);

	useEffect(() => {
		if (!service) {
			setLoading(false);
			return;
		}
		Promise.all([
			service.getTemplates(),
			service.getAgentNames(),
		]).then(([templateResult, agentResult]) => {
			if (templateResult.data) setTemplates(templateResult.data);
			if (templateResult.error) setError(templateResult.error);
			if (agentResult.data) setAgentNames(agentResult.data);
			setLoading(false);
		});
	}, [service]);

	const fetchToolsForAgent = useCallback(
		async (agent: string): Promise<string[]> => {
			if (!service) return [];
			const result = await service.getToolNames(agent);
			if (result.data) {
				const usedNames = new Set(templates.map((t) => t.name));
				return result.data.filter((name) => !usedNames.has(name));
			}
			return [];
		},
		[service, templates],
	);

	const filtered = useMemo(() => {
		if (!searchQuery.trim()) return templates;
		const q = searchQuery.toLowerCase();
		return templates.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				(t.description?.toLowerCase().includes(q) ?? false) ||
				(t.agent?.toLowerCase().includes(q) ?? false),
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

	const openDesigner = useCallback((template: ITemplate) => {
		setDesignTarget(template);
	}, []);

	const closeDesigner = useCallback(() => {
		setDesignTarget(null);
	}, []);

	const handleDesignerSave = useCallback(
		async (
			designerTemplate: IDesignerTemplate,
			dataSource?: Record<string, unknown> | string,
		) => {
			if (!service || !designTarget?.id) return;
			const updated: ITemplate = {
				...designTarget,
				content: JSON.stringify(designerTemplate),
				data:
					typeof dataSource === "string"
						? dataSource
						: dataSource
							? JSON.stringify(dataSource)
							: designTarget.data,
			};
			try {
				const result = await service.updateTemplate(updated);
				if (result.error) throw new Error(result.error);
				setTemplates((prev) =>
					prev.map((t) =>
						t.id === designTarget.id ? (result.data ?? updated) : t,
					),
				);
				setDesignTarget(result.data ?? updated);
			} catch {
				// silent — TemplateDesigner shows its own save feedback
			}
		},
		[service, designTarget],
	);

	return {
		service,
		canManage,
		templates,
		filtered,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		agentNames,
		fetchToolsForAgent,
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
		designTarget,
		openDesigner,
		closeDesigner,
		handleDesignerSave,
	};
};
