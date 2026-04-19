import {
	Dropdown,
	Input,
	Option,
	Skeleton,
	SkeletonItem,
	Spinner,
} from "@fluentui/react-components";
import {
	Bot20Regular,
	DocumentRegular,
	TextDescription20Regular,
} from "@fluentui/react-icons";
import React, { useCallback, useMemo, useState } from "react";
import type {
	ITemplateFormProps,
	ITemplateFormState,
} from "./TemplateForm.models";
import { useTemplateFormStyles } from "./TemplateForm.styles";
import { SlidePanel } from "../../../../common/slide-panel";

const createFormState = (
	template: ITemplateFormProps["template"],
): ITemplateFormState =>
	template
		? {
				name: template.name,
				description: template.description ?? "",
				agents: template.agents ?? [],
			}
		: { name: "", description: "", agents: [] };

export const TemplateForm = (props: ITemplateFormProps) => {
	const {
		template,
		agents,
		isSidebar = false,
		isLoading,
		error,
		onSave,
		onClose,
	} = props;
	const classes = useTemplateFormStyles();

	const [form, setForm] = useState<ITemplateFormState>(
		createFormState(template),
	);
	const [formError, setFormError] = useState("");
	const displayError = error || formError;
	const [isSaving, setIsSaving] = useState(false);
	const isDisabled = !!(isSaving || isLoading);

	const selectedAgentsLabel = useMemo(
		() => form.agents.join(", "),
		[form.agents],
	);

	const handleAgentsChange = useCallback(
		(_event: unknown, data: { selectedOptions: string[] }) => {
			setForm((prev) => ({ ...prev, agents: data.selectedOptions }));
		},
		[],
	);

	const handleSave = useCallback(async () => {
		const trimmedName = form.name.trim();
		if (!trimmedName) {
			setFormError("Template name is required.");
			return;
		}

		setFormError("");
		setIsSaving(true);
		try {
			await onSave({
				...(template ? { id: template.id } : {}),
				name: trimmedName,
				description: form.description.trim() || undefined,
				agents: form.agents,
			});
			onClose();
		} catch (error) {
			setFormError(
				error instanceof Error ? error.message : "Failed to save template.",
			);
		} finally {
			setIsSaving(false);
		}
	}, [form, template, onSave, onClose]);

	/* ── Render helpers ──────────────────────────────────────────────── */

	const renderLoadingSkeleton = () => (
		<div className={classes.panelShimmerOverlay}>
			<Skeleton animation="pulse" aria-label="Loading template">
				<div className={classes.shimmerColumn}>
					<SkeletonItem size={16} style={{ width: "40%" }} />
					<SkeletonItem size={32} style={{ width: "100%" }} />
				</div>
				<div className={classes.shimmerColumn}>
					<SkeletonItem size={16} style={{ width: "35%" }} />
					<SkeletonItem size={32} style={{ width: "100%" }} />
				</div>
				<div className={classes.shimmerColumn}>
					<SkeletonItem size={16} style={{ width: "25%" }} />
					<SkeletonItem size={32} style={{ width: "100%" }} />
				</div>
			</Skeleton>
		</div>
	);

	const renderFormField = (
		icon: React.ReactNode,
		title: string,
		description: string,
		content: React.ReactNode,
	) => (
		<div className={classes.formField}>
			<div className={classes.formFieldHeader}>
				<span className={classes.fieldIcon}>{icon}</span>
				<div className={classes.fieldTitleGroup}>
					<div className={classes.fieldTitle}>{title}</div>
					<div className={classes.fieldDescription}>{description}</div>
				</div>
			</div>
			<div className={classes.formFieldContent}>{content}</div>
		</div>
	);

	const renderFormFields = () => (
		<>
			{renderFormField(
				<TextDescription20Regular />,
				"Name *",
				"A short, descriptive name for this template.",
				<Input
					className={classes.fieldInput}
					placeholder="e.g. Credit Request List"
					value={form.name}
					onChange={(_e, data) =>
						setForm((prev) => ({ ...prev, name: data.value }))
					}
				/>,
			)}

			{renderFormField(
				<TextDescription20Regular />,
				"Description",
				"Optional summary of what this template renders.",
				<Input
					className={classes.fieldInput}
					placeholder="e.g. Renders credit requests as a sortable table"
					value={form.description}
					onChange={(_e, data) =>
						setForm((prev) => ({ ...prev, description: data.value }))
					}
				/>,
			)}

			{renderFormField(
				<Bot20Regular />,
				"Agents",
				"Associate this template with one or more agents.",
				<Dropdown
					className={classes.fieldInput}
					placeholder="Select agents"
					multiselect
					value={selectedAgentsLabel}
					selectedOptions={form.agents}
					onOptionSelect={handleAgentsChange}
				>
					{(agents ?? []).map((agent) => (
						<Option key={agent.name} value={agent.name}>
							{agent.name}
						</Option>
					))}
				</Dropdown>,
			)}
		</>
	);

	/* ── Render ──────────────────────────────────────────────────────── */

	return (
		<SlidePanel
			title={template ? "Edit Template" : "New Template"}
			icon={<DocumentRegular />}
			isSidebar={isSidebar}
			buttons={{
				submitLabel: template ? "Save" : "Create",
				submitDisabled: !form.name.trim(),
				onSubmit: handleSave,
				onCancel: onClose,
			}}
			disabled={isDisabled}
			error={displayError || undefined}
			onClose={onClose}
		>
			{isLoading && renderLoadingSkeleton()}
			{renderFormFields()}

			{isSaving && (
				<div className={classes.panelBusyOverlay}>
					<Spinner label="Saving template..." size="small" />
				</div>
			)}
		</SlidePanel>
	);
};
