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
	Edit24Regular,
	Search20Regular,
} from "@fluentui/react-icons";
import { useCallback, useMemo } from "react";
import type { IAIAssistantStarterPrompt } from "../../AIAssistant.models";
import type { IStarterPromptPageProps } from "./StarterPromptPage.models";
import { useStarterPromptPage } from "./StarterPromptPage.hooks";
import { useStarterPromptPageStyles } from "./StarterPromptPage.styles";
import { getPromptPreview } from "./StarterPromptPage.utils";
import { StarterPromptForm } from "./starter-prompt-form/StarterPromptForm";
import { PageLayout } from "../../../common/page-layout";
import { AIAssistantPermission } from "../../AIAssistant.models";
import { checkPermission } from "../../../ai-assistant/AIAssistant.utils";
import { useAiAssistantContext } from "../..";

export const StarterPromptPage = (props: IStarterPromptPageProps) => {
	const { agents, isSidebar = false, onClose } = props;
	const { permissions, service } = useAiAssistantContext();
	const classes = useStarterPromptPageStyles();
	const { state, actions } = useStarterPromptPage(props, service);

	const canManage = checkPermission(
		permissions,
		AIAssistantPermission.ManageStarterPrompts,
	);
	const {
		prompts,
		panelTarget,
		deleteTarget,
		deleteError,
		isDeleting,
		isSaving,
		panelError,
		searchQuery,
	} = state;

	const allPrompts = useMemo(() => prompts.data ?? [], [prompts.data]);

	const isPanelOpen = panelTarget !== null;
	const editTarget =
		panelTarget !== null && panelTarget !== undefined ? panelTarget : null;

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
			promptRow: merge("promptRow"),
			promptTitle: merge("promptTitle"),
			agentBadge: merge("agentBadge"),
			promptText: merge("promptText"),
			rowActions: merge("rowActions"),
			iconButton: merge("iconButton"),
		};
	}, [classes, isSidebar]);

	const availableAgentNames = useMemo(() => {
		const values = new Set<string>();

		agents?.forEach((agent) => {
			const agentName = agent.name.trim();

			if (agentName) {
				values.add(agentName);
			}
		});

		allPrompts.forEach((prompt) => {
			const agentName = prompt.agentName?.trim();

			if (agentName) {
				values.add(agentName);
			}
		});

		return Array.from(values);
	}, [agents, allPrompts]);

	const filteredPrompts = allPrompts.filter((prompt) => {
		const query = searchQuery.toLowerCase().trim();

		if (!query) {
			return true;
		}

		return (
			prompt.title.toLowerCase().includes(query) ||
			(prompt.prompt ?? "").toLowerCase().includes(query) ||
			(prompt.description ?? "").toLowerCase().includes(query) ||
			(prompt.agentName ?? "").toLowerCase().includes(query) ||
			(prompt.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
		);
	});

	const isInitialLoading = Boolean(prompts.loading && allPrompts.length === 0);
	const buttonSize = isSidebar ? ("small" as const) : ("medium" as const);

	const openCreatePanel = useCallback(() => {
		actions.openCreatePanel();
	}, [actions]);

	const openEditPanel = useCallback(
		(prompt: IAIAssistantStarterPrompt) => {
			actions.openEditPanel(prompt);
		},
		[actions],
	);

	const handleDelete = useCallback(async () => {
		await actions.confirmDelete();
	}, [actions]);

	const renderHeaderActions = () => {
		if (!canManage) return null;
		if (isSidebar) {
			return (
				<Button
					appearance="primary"
					className={mergedStyles.addButton}
					size="small"
					icon={<Add16Regular />}
					onClick={openCreatePanel}
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
				disabled={isInitialLoading}
				onClick={openCreatePanel}
			>
				Add New
			</Button>
		);
	};

	const renderToolbar = () => (
		<>
			{isSidebar ? (
				<div className={mergedStyles.toolbarTopRow}>
					{allPrompts.length > 0 && (
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
						{filteredPrompts.length} starter prompt
						{filteredPrompts.length === 1 ? "" : "s"}
					</span>
				</div>
			) : (
				allPrompts.length > 0 && (
					<Input
						className={mergedStyles.searchInput}
						size="medium"
						contentBefore={<Search20Regular fontSize={20} />}
						input={{ className: classes.searchInputField }}
						placeholder="Search starter prompts"
						value={searchQuery}
						onChange={(_, data) => actions.setSearchQuery(data.value)}
					/>
				)
			)}
			{!isSidebar && (
				<span className={mergedStyles.countText}>
					{filteredPrompts.length} starter prompt
					{filteredPrompts.length === 1 ? "" : "s"}
				</span>
			)}
		</>
	);

	const renderPromptRow = (prompt: IAIAssistantStarterPrompt) => {
		const editButton = canManage ? (
			<Button
				appearance="subtle"
				className={mergedStyles.iconButton}
				size={buttonSize}
				icon={<Edit24Regular />}
				aria-label={`Edit ${prompt.title}`}
				onClick={() => openEditPanel(prompt)}
			/>
		) : null;

		const deleteButton = canManage ? (
			<Button
				appearance="subtle"
				className={mergedStyles.iconButton}
				size={buttonSize}
				icon={<Delete24Regular />}
				aria-label={`Delete ${prompt.title}`}
				disabled={!prompt.id}
				onClick={() => actions.openDeleteDialog(prompt)}
			/>
		) : null;

		return (
			<div
				key={prompt.id ?? `${prompt.agentName}_${prompt.title}`}
				className={mergedStyles.promptRow}
			>
				<div className={classes.promptContent}>
					<div className={classes.promptTitleRow}>
						<div className={mergedStyles.promptTitle}>{prompt.title}</div>
						{prompt.agentName && (
							<span className={mergedStyles.agentBadge}>
								{prompt.agentName}
							</span>
						)}
					</div>
					<div className={mergedStyles.promptText}>
						{getPromptPreview(prompt.prompt ?? "", prompt.description)}
					</div>
				</div>
				<div className={mergedStyles.rowActions}>
					{isSidebar ? (
						<>
							<Tooltip content="Edit" relationship="label">
								<span className={classes.rowActionTooltipTarget}>
									{editButton}
								</span>
							</Tooltip>
							<Tooltip content="Delete" relationship="label">
								<span className={classes.rowActionTooltipTarget}>
									{deleteButton}
								</span>
							</Tooltip>
						</>
					) : (
						<>
							{editButton}
							{deleteButton}
						</>
					)}
				</div>
			</div>
		);
	};

	const renderLoadingSkeleton = () => (
		<div className={mergedStyles.list}>
			<Skeleton animation="pulse" aria-label="Loading starter prompts">
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} className={mergedStyles.promptRow}>
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
						</div>
					</div>
				))}
			</Skeleton>
		</div>
	);

	const renderErrorState = () => (
		<div className={classes.emptyState}>
			<div className={classes.emptyTitle}>Failed to load starter prompts</div>
			<div className={classes.emptyDescription}>
				{prompts.error ?? "Something went wrong. Please try again."}
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

	const renderContent = () => {
		if (isInitialLoading) return renderLoadingSkeleton();
		if (prompts.error && allPrompts.length === 0) return renderErrorState();

		if (allPrompts.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyIcon}>
						<Add24Regular />
					</div>
					<div className={classes.emptyTitle}>No starter prompts yet</div>
					<div className={classes.emptyDescription}>
						Create your first starter prompt to help users begin common tasks
						faster.
					</div>
					{canManage && (
						<Button
							appearance="primary"
							className={classes.emptyAction}
							onClick={openCreatePanel}
						>
							Create Starter Prompt
						</Button>
					)}
				</div>
			);
		}

		if (filteredPrompts.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>No prompts match your search</div>
					<div className={classes.emptyDescription}>
						Try a different keyword or clear the current filter.
					</div>
				</div>
			);
		}

		return (
			<div className={mergedStyles.list}>
				{filteredPrompts.map(renderPromptRow)}
			</div>
		);
	};

	const renderDeleteDialog = () => (
		<Dialog
			open={Boolean(deleteTarget)}
			onOpenChange={(_, data) => {
				if (!data.open && !isDeleting) {
					actions.closeDeleteDialog();
				}
			}}
		>
			<DialogSurface>
				<DialogBody>
					<DialogTitle>Delete starter prompt</DialogTitle>
					<DialogContent className={classes.dialogContent}>
						<div>
							{deleteTarget
								? `Delete "${deleteTarget.title}" for ${deleteTarget.agentName ?? "this agent"}?`
								: "Delete this starter prompt?"}
						</div>
						{deleteError && (
							<div className={classes.errorBanner}>{deleteError}</div>
						)}
					</DialogContent>
					<DialogActions>
						<Button
							appearance="secondary"
							disabled={isDeleting}
							onClick={() => actions.closeDeleteDialog()}
						>
							Cancel
						</Button>
						<Button
							appearance="primary"
							disabled={isDeleting}
							onClick={handleDelete}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogActions>
				</DialogBody>
			</DialogSurface>
		</Dialog>
	);

	return (
		<PageLayout
			title="Starter Prompts"
			isSidebar={isSidebar}
			headerActions={renderHeaderActions()}
			toolbar={renderToolbar()}
			onClose={onClose}
		>
			{renderContent()}
			{isPanelOpen && (
				<StarterPromptForm
					prompt={editTarget}
					isSidebar={isSidebar}
					agents={availableAgentNames}
					loading={isSaving}
					panelError={panelError}
					onSave={actions.savePrompt}
					onClose={actions.closePanel}
				/>
			)}
			{renderDeleteDialog()}
		</PageLayout>
	);
};
