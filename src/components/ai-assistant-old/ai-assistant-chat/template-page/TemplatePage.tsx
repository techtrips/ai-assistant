import {
	Button,
	Dialog,
	DialogActions,
	DialogBody,
	DialogContent,
	DialogSurface,
	DialogTitle,
	Input,
	Skeleton,
	SkeletonItem,
	Tooltip,
	mergeClasses,
} from "@fluentui/react-components";
import {
	Add16Regular,
	Add24Regular,
	Delete24Regular,
	PaintBrush24Regular,
	Edit24Regular,
	Search20Regular,
} from "@fluentui/react-icons";
import { useMemo } from "react";
import type {
	IAIAssistantTemplate,
	ITemplatePageProps,
} from "./TemplatePage.models";
import { useTemplatePageStyles } from "./TemplatePage.styles";
import { useTemplatePage } from "./TemplatePage.hooks";
import { TemplateForm } from "./template-form/TemplateForm";
import { TemplateDesign } from "./template-design/TemplateDesign";
import { PageLayout } from "../../../common/page-layout";
import { AIAssistantPermission } from "../../AIAssistant.models";
import { checkPermission } from "../../../ai-assistant/AIAssistant.utils";
import { useAiAssistantContext } from "../../AiAssistant.context";

export const TemplatePage = (props: ITemplatePageProps) => {
	const { agents, isSidebar = false, onClose } = props;
	const { permissions, service } = useAiAssistantContext();
	const { state, actions } = useTemplatePage(props, service);
	const canManage = checkPermission(
		permissions,
		AIAssistantPermission.ManageTemplates,
	);
	const {
		templates,
		formPanelTarget,
		designPanelTarget,
		deleteTarget,
		deleteError,
		isDeleting,
		isPanelLoading,
		panelError,
		searchQuery,
	} = state;
	const classes = useTemplatePageStyles();
	const allTemplates = useMemo(() => templates.data ?? [], [templates.data]);

	const mergedStyles = useMemo(() => {
		const merge = (key: keyof typeof classes) =>
			mergeClasses(
				classes[key],
				isSidebar && classes[`${key}Sidebar` as keyof typeof classes],
			);

		return {
			addButton: merge("addButton"),
			toolbarTopRow: merge("toolbarTopRow"),
			countText: merge("countText"),
			searchInput: merge("searchInput"),
			list: merge("list"),
			templateRow: merge("templateRow"),
			templateTitle: merge("templateTitle"),
			agentBadge: merge("agentBadge"),
			templateDescription: merge("templateDescription"),
			rowActions: merge("rowActions"),
			iconButton: merge("iconButton"),
		};
	}, [classes, isSidebar]);

	const filteredTemplates = useMemo(() => {
		if (!searchQuery.trim()) return allTemplates;
		const lower = searchQuery.toLowerCase();
		return allTemplates.filter(
			(t) =>
				t.name.toLowerCase().includes(lower) ||
				(t.description?.toLowerCase().includes(lower) ?? false) ||
				t.agents.some((a) => a.toLowerCase().includes(lower)),
		);
	}, [allTemplates, searchQuery]);

	const isInitialLoading = !!(templates.loading && !allTemplates.length);
	const hasTemplates = allTemplates.length > 0;
	const buttonSize = isSidebar ? ("small" as const) : ("medium" as const);

	/* ── Render helpers ──────────────────────────────────────────────── */

	const renderHeaderActions = () => {
		if (!canManage) return null;
		if (isSidebar) {
			return (
				<Button
					appearance="primary"
					className={mergedStyles.addButton}
					size="small"
					icon={<Add16Regular />}
					onClick={() => actions.openFormPanel(null)}
				>
					Add New
				</Button>
			);
		}
		return (
			<Button
				appearance="primary"
				className={mergedStyles.addButton}
				size="medium"
				icon={<Add24Regular fontSize={20} />}
				onClick={() => actions.openFormPanel(null)}
				disabled={isInitialLoading}
			>
				Add New
			</Button>
		);
	};

	const renderSidebarToolbar = () => (
		<div className={mergedStyles.toolbarTopRow}>
			{hasTemplates && (
				<Input
					className={mergedStyles.searchInput}
					size="small"
					contentBefore={<Search20Regular fontSize={16} />}
					input={{ className: classes.searchInputField }}
					placeholder="Search"
					value={searchQuery}
					onChange={(_, data) => actions.setSearchQuery(data.value)}
				/>
			)}
			<span className={mergedStyles.countText}>
				{filteredTemplates.length} template
				{filteredTemplates.length === 1 ? "" : "s"}
			</span>
		</div>
	);

	const renderDesktopToolbar = () => (
		<>
			{hasTemplates && (
				<Input
					className={mergedStyles.searchInput}
					size="medium"
					contentBefore={<Search20Regular fontSize={20} />}
					input={{ className: classes.searchInputField }}
					placeholder="Search templates"
					value={searchQuery}
					onChange={(_, data) => actions.setSearchQuery(data.value)}
				/>
			)}
			<span className={mergedStyles.countText}>
				{filteredTemplates.length} template
				{filteredTemplates.length === 1 ? "" : "s"}
			</span>
		</>
	);

	const renderLoadingSkeleton = () => (
		<div className={mergedStyles.list}>
			<Skeleton animation="pulse" aria-label="Loading templates">
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} className={mergedStyles.templateRow}>
						<div className={classes.shimmerColumn}>
							<div className={classes.shimmerRow}>
								<SkeletonItem size={16} style={{ width: "30%" }} />
								<SkeletonItem size={16} style={{ width: "12%" }} />
							</div>
							<SkeletonItem size={12} style={{ width: "70%" }} />
						</div>
						<div className={classes.shimmerRow}>
							<SkeletonItem shape="circle" size={28} />
							<SkeletonItem shape="circle" size={28} />
							<SkeletonItem shape="circle" size={28} />
						</div>
					</div>
				))}
			</Skeleton>
		</div>
	);

	const renderEmptyState = () => (
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
				<Button
					appearance="primary"
					className={classes.emptyAction}
					onClick={() => actions.openFormPanel(null)}
				>
					Create Template
				</Button>
			)}
		</div>
	);

	const renderNoMatchState = () => (
		<div className={classes.emptyState}>
			<div className={classes.emptyTitle}>No templates match your search</div>
			<div className={classes.emptyDescription}>
				Try a different keyword or clear the current filter.
			</div>
		</div>
	);

	const renderErrorState = () => (
		<div className={classes.emptyState}>
			<div className={classes.emptyTitle}>Failed to load templates</div>
			<div className={classes.emptyDescription}>
				{templates.error ?? "Something went wrong. Please try again."}
			</div>
			<Button
				appearance="primary"
				className={classes.emptyAction}
				onClick={() => actions.initialize()}
			>
				Retry
			</Button>
		</div>
	);

	const renderTemplateRow = (template: IAIAssistantTemplate) => (
		<div
			key={template.id ?? template.name}
			className={mergedStyles.templateRow}
		>
			<div className={classes.templateContent}>
				<div className={classes.templateTitleRow}>
					<span className={mergedStyles.templateTitle}>{template.name}</span>
					{template.agents.map((agent) => (
						<span key={agent} className={mergedStyles.agentBadge}>
							{agent}
						</span>
					))}
				</div>
				{template.description && (
					<div className={mergedStyles.templateDescription}>
						{template.description}
					</div>
				)}
			</div>
			<div className={mergedStyles.rowActions}>
				<Tooltip content="Design" relationship="label">
					<span className={classes.rowActionTooltipTarget}>
						<Button
							className={mergedStyles.iconButton}
							appearance="subtle"
							size={buttonSize}
							icon={<PaintBrush24Regular />}
							onClick={() => actions.openDesignPanel(template)}
						/>
					</span>
				</Tooltip>
				{canManage && (
					<Tooltip content="Edit" relationship="label">
						<span className={classes.rowActionTooltipTarget}>
							<Button
								className={mergedStyles.iconButton}
								appearance="subtle"
								size={buttonSize}
								icon={<Edit24Regular />}
								onClick={() => actions.openFormPanel(template)}
							/>
						</span>
					</Tooltip>
				)}
				{canManage && (
					<Tooltip content="Delete" relationship="label">
						<span className={classes.rowActionTooltipTarget}>
							<Button
								className={mergedStyles.iconButton}
								appearance="subtle"
								size={buttonSize}
								icon={<Delete24Regular />}
								onClick={() => actions.openDeleteDialog(template)}
							/>
						</span>
					</Tooltip>
				)}
			</div>
		</div>
	);

	const renderContent = () => {
		if (isInitialLoading) return renderLoadingSkeleton();
		if (templates.error && allTemplates.length === 0) return renderErrorState();
		if (allTemplates.length === 0) return renderEmptyState();
		if (filteredTemplates.length === 0) return renderNoMatchState();
		return (
			<div className={mergedStyles.list}>
				{filteredTemplates.map(renderTemplateRow)}
			</div>
		);
	};

	/* ── Render ──────────────────────────────────────────────────────── */

	return (
		<PageLayout
			title="Templates"
			isSidebar={isSidebar}
			headerActions={renderHeaderActions()}
			toolbar={isSidebar ? renderSidebarToolbar() : renderDesktopToolbar()}
			onClose={onClose}
		>
			{renderContent()}

			{formPanelTarget !== undefined && (
				<TemplateForm
					template={formPanelTarget}
					agents={agents}
					isSidebar={isSidebar}
					isLoading={isPanelLoading}
					error={panelError}
					onSave={actions.saveTemplate}
					onClose={actions.closeFormPanel}
				/>
			)}

			{designPanelTarget && (
				<TemplateDesign
					template={designPanelTarget}
					isLoading={isPanelLoading}
					isReadOnly={!canManage}
					error={panelError}
					onSave={actions.saveTemplate}
					onClose={actions.closeDesignPanel}
				/>
			)}

			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(_e, data) => {
					if (!data.open) actions.closeDeleteDialog();
				}}
			>
				<DialogSurface>
					<DialogBody>
						<DialogTitle>Delete Template</DialogTitle>
						<DialogContent className={classes.dialogContent}>
							<p>
								Are you sure you want to delete{" "}
								<strong>{deleteTarget?.name}</strong>? This action cannot be
								undone.
							</p>
							{deleteError && (
								<div className={classes.errorBanner}>{deleteError}</div>
							)}
						</DialogContent>
						<DialogActions>
							<Button
								appearance="secondary"
								disabled={isDeleting}
								onClick={actions.closeDeleteDialog}
							>
								Cancel
							</Button>
							<Button
								appearance="primary"
								disabled={isDeleting}
								onClick={actions.confirmDelete}
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
						</DialogActions>
					</DialogBody>
				</DialogSurface>
			</Dialog>
		</PageLayout>
	);
};
