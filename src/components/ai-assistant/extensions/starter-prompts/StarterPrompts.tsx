import {
	Add16Regular,
	Add24Regular,
	Delete20Regular,
	Edit20Regular,
	LightbulbRegular,
	Search20Regular,
} from "@fluentui/react-icons";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { Shimmer } from "../../../common/shimmer";
import { useStarterPromptsStyles } from "./StarterPrompts.styles";
import { useStarterPrompts } from "./useStarterPrompts";
import { StarterPromptForm } from "./StarterPromptForm";

const StarterPromptsPanel = ({ onClose }: IExtensionProps) => {
	const classes = useStarterPromptsStyles();
	const {
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
	} = useStarterPrompts();

	if (!service) {
		return (
			<PageLayout title="Starter Prompts" onClose={onClose}>
				<div className={classes.noService}>Service not configured</div>
			</PageLayout>
		);
	}

	const renderToolbar = () => (
		<>
			{prompts.length > 0 && (
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
				{filtered.length} starter prompt
				{filtered.length === 1 ? "" : "s"}
			</span>
		</>
	);

	const renderContent = () => {
		if (loading) {
			return <Shimmer layout="list" rows={4} />;
		}
		if (error && prompts.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>Failed to load</div>
					<div className={classes.emptyDescription}>{error}</div>
				</div>
			);
		}
		if (prompts.length === 0) {
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
						<button
							className={classes.addButton}
							type="button"
							style={{ marginTop: "16px" }}
							onClick={openCreatePanel}
						>
							Create Starter Prompt
						</button>
					)}
				</div>
			);
		}
		if (filtered.length === 0) {
			return (
				<div className={classes.emptyState}>
					<div className={classes.emptyTitle}>No prompts match your search</div>
					<div className={classes.emptyDescription}>
						Try a different keyword or clear the filter.
					</div>
				</div>
			);
		}
		return (
			<div className={classes.list}>
				{filtered.map((prompt) => (
					<div
						key={prompt.id ?? `${prompt.agentName}_${prompt.title}`}
						className={classes.row}
					>
						<div
							className={classes.rowContent}
							style={{ cursor: "pointer" }}
							onClick={() => handleSelect(prompt, onClose)}
						>
							<div className={classes.rowTitleRow}>
								<span className={classes.rowTitle}>{prompt.title}</span>
								{prompt.agentName && (
									<span className={classes.agentBadge}>{prompt.agentName}</span>
								)}
							</div>
							<div className={classes.rowPromptText}>
								{prompt.prompt || prompt.description || ""}
							</div>
						</div>
						{canManage && (
							<div className={classes.rowActions}>
								<button
									className={classes.iconButton}
									type="button"
									title="Edit"
									aria-label={`Edit ${prompt.title}`}
									onClick={() => openEditPanel(prompt)}
								>
									<Edit20Regular fontSize={16} />
								</button>
								<button
									className={classes.iconButton}
									type="button"
									title="Delete"
									aria-label={`Delete ${prompt.title}`}
									disabled={!prompt.id}
									onClick={() => openDeleteDialog(prompt)}
								>
									<Delete20Regular fontSize={16} />
								</button>
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<PageLayout
			title="Starter Prompts"
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
				<StarterPromptForm
					target={panelTarget !== undefined ? panelTarget : null}
					agents={agentNames}
					saving={saving}
					error={panelError}
					onSave={handleSave}
					onClose={closePanel}
				/>
			)}

			{deleteTarget && (
				<div className={classes.dialogOverlay}>
					<div className={classes.dialog}>
						<div className={classes.dialogTitle}>Delete starter prompt</div>
						<div className={classes.dialogText}>
							Delete "{deleteTarget.title}" for{" "}
							{deleteTarget.agentName ?? "this agent"}?
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

export const StarterPrompts = defineExtension(StarterPromptsPanel, {
	key: "prompts",
	label: "Starter Prompts",
	icon: LightbulbRegular,
});
