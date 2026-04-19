import {
	Add16Regular,
	Add24Regular,
	CheckmarkCircle12Regular,
	Circle12Regular,
	Delete20Regular,
	DocumentRegular,
	Edit20Regular,
	PaintBrush20Regular,
	Search20Regular,
} from "@fluentui/react-icons";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { Shimmer } from "../../../common/shimmer";
import { useTemplateRendererStyles } from "./TemplateRenderer.styles";
import { useTemplateRenderer } from "./useTemplateRenderer";
import { TemplateForm } from "./TemplateForm";
import { TemplateDesigner } from "../../../templates/template-designer";

const TemplateRendererPanel = ({ onClose }: IExtensionProps) => {
	const classes = useTemplateRendererStyles();
	const {
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
	} = useTemplateRenderer();

	if (!service) {
		return (
			<PageLayout title="Templates" onClose={onClose}>
				<div className={classes.noService}>Service not configured</div>
			</PageLayout>
		);
	}

	const renderToolbar = () => (
		<>
			{templates.length > 0 && (
				<div className={classes.searchWrap}>
					<Search20Regular fontSize={16} className={classes.searchIcon} />
					<input
						className={classes.searchInput}
						placeholder="Search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			)}
			<span className={classes.countText}>
				{filtered.length} template{filtered.length === 1 ? "" : "s"}
			</span>
		</>
	);

	const renderRow = (template: (typeof templates)[0]) => {
		const hasContent = !!template.content;
		return (
			<div key={template.id ?? template.name} className={classes.row}>
				<div className={classes.rowContent}>
					<div className={classes.rowTitleRow}>
						<span className={classes.rowTitle}>{template.name}</span>
						{template.agent && (
							<span className={classes.agentBadge}>
								{template.agent}
							</span>
						)}
						<span
							className={
								hasContent
									? classes.statusBadgeActive
									: classes.statusBadgeEmpty
							}
							title={hasContent ? "Template designed" : "No design yet"}
						>
							{hasContent ? (
								<CheckmarkCircle12Regular />
							) : (
								<Circle12Regular />
							)}
							{hasContent ? "Designed" : "Not designed"}
						</span>
					</div>
					{template.description && (
						<div className={classes.rowDescription}>
							{template.description}
						</div>
					)}
				</div>
				{canManage && (
					<div className={classes.rowActions}>
						<button
							className={classes.iconButton}
							type="button"
							title="Design template"
							aria-label={`Design ${template.name}`}
							disabled={!template.id}
							onClick={() => openDesigner(template)}
						>
							<PaintBrush20Regular fontSize={16} />
						</button>
						<button
							className={classes.iconButton}
							type="button"
							title="Edit details"
							aria-label={`Edit ${template.name}`}
							onClick={() => openEditPanel(template)}
						>
							<Edit20Regular fontSize={16} />
						</button>
						<button
							className={classes.iconButton}
							type="button"
							title="Delete"
							aria-label={`Delete ${template.name}`}
							disabled={!template.id}
							onClick={() => openDeleteDialog(template)}
						>
							<Delete20Regular fontSize={16} />
						</button>
					</div>
				)}
			</div>
		);
	};

	const renderContent = () => {
		if (loading) {
			return <Shimmer layout="list" rows={4} />;
		}
		if (error && templates.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>Failed to load</div>
					<div className={classes.emptyDescription}>{error}</div>
				</div>
			);
		}
		if (templates.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyIcon}>
						<Add24Regular />
					</div>
					<div className={classes.emptyTitle}>No templates yet</div>
					<div className={classes.emptyDescription}>
						Create your first template to help render structured data in the
						assistant.
					</div>
					{canManage && (
						<button
							className={classes.addButton}
							type="button"
							style={{ marginTop: "16px" }}
							onClick={openCreatePanel}
						>
							Create Template
						</button>
					)}
				</div>
			);
		}
		if (filtered.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>
						No templates match your search
					</div>
					<div className={classes.emptyDescription}>
						Try a different keyword or clear the filter.
					</div>
				</div>
			);
		}
		return <div className={classes.list}>{filtered.map(renderRow)}</div>;
	};

	if (designTarget) {
		const templateContent = designTarget.content
			? designTarget.content
			: undefined;
		const dataSource = designTarget.data ? designTarget.data : undefined;

		return (
			<TemplateDesigner
				template={templateContent}
				dataSource={dataSource}
				isReadOnly={!canManage}
				onSave={handleDesignerSave}
				onClose={closeDesigner}
			/>
		);
	}

	return (
		<PageLayout
			title="Templates"
			headerActions={
				canManage ? (
					<button
						className={classes.addButton}
						type="button"
						onClick={openCreatePanel}
					>
						<Add16Regular fontSize={14} />
						Add New
					</button>
				) : undefined
			}
			toolbar={renderToolbar()}
			onClose={onClose}
		>
			{renderContent()}

			{panelTarget !== null && (
				<TemplateForm
					target={panelTarget !== undefined ? panelTarget : null}
					agentNames={agentNames}
					fetchToolsForAgent={fetchToolsForAgent}
					saving={saving}
					error={panelError}
					onSave={handleSave}
					onClose={closePanel}
				/>
			)}

			{deleteTarget && (
				<div className={classes.dialogOverlay}>
					<div className={classes.dialog}>
						<div className={classes.dialogTitle}>Delete template</div>
						<div className={classes.dialogText}>
							Delete "{deleteTarget.name}"?
						</div>
						{deleteError && (
							<div className={classes.errorBanner}>{deleteError}</div>
						)}
						<div className={classes.dialogActions}>
							<button
								className={classes.dialogButton}
								type="button"
								disabled={deleting}
								onClick={closeDeleteDialog}
							>
								Cancel
							</button>
							<button
								className={`${classes.dialogButton} ${classes.dialogButtonDanger}`}
								type="button"
								disabled={deleting}
								onClick={handleDelete}
							>
								{deleting ? "Deleting…" : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</PageLayout>
	);
};

export const TemplateRenderer = defineExtension(TemplateRendererPanel, {
	key: "templates",
	label: "Templates",
	icon: DocumentRegular,
});
