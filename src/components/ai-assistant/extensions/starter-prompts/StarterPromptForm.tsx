import type { ReactNode } from "react";
import {
	Bot20Regular,
	Chat20Regular,
	Dismiss12Regular,
	LightbulbRegular,
	NumberSymbol20Regular,
	Tag20Regular,
	TextDescription20Regular,
} from "@fluentui/react-icons";
import { SlidePanel } from "../shared/slide-panel";
import type { IStarterPrompt } from "../../AIAssistant.types";
import { useStarterPromptFormStyles } from "./StarterPromptForm.styles";
import { useStarterPromptForm } from "./useStarterPromptForm";

interface StarterPromptFormProps {
	target: IStarterPrompt | null;
	agents: string[];
	saving: boolean;
	error: string;
	onSave: (p: IStarterPrompt) => Promise<void>;
	onClose: () => void;
}

export const StarterPromptForm = ({
	target,
	agents,
	saving,
	error,
	onSave,
	onClose,
}: StarterPromptFormProps) => {
	const classes = useStarterPromptFormStyles();
	const {
		form,
		isValid,
		paramInput,
		setParamInput,
		tagInput,
		setTagInput,
		updateField,
		handlePromptChange,
		addParam,
		removeParam,
		addTag,
		removeTag,
		handleKeyDown,
		handleSubmit,
	} = useStarterPromptForm(target, agents, onSave);

	const renderField = (
		icon: ReactNode,
		title: string,
		desc: string,
		content: ReactNode,
	) => (
		<div className={classes.formField}>
			<div className={classes.formFieldHeader}>
				<div className={classes.fieldIcon}>{icon}</div>
				<div className={classes.fieldTitleGroup}>
					<div className={classes.fieldTitle}>{title}</div>
					<div className={classes.fieldDescription}>{desc}</div>
				</div>
			</div>
			<div className={classes.fieldContent}>{content}</div>
		</div>
	);

	const renderTagsField = (
		items: string[],
		inputValue: string,
		setInputValue: (v: string) => void,
		onAdd: () => void,
		onRemove: (item: string) => void,
		placeholder: string,
	) => (
		<div className={classes.tagsInput}>
			{items.map((item) => (
				<span key={item} className={classes.tagChip}>
					{item}
					<button
						className={classes.tagRemove}
						type="button"
						aria-label={`Remove ${item}`}
						onClick={() => onRemove(item)}
					>
						<Dismiss12Regular />
					</button>
				</span>
			))}
			<input
				className={classes.tagInlineInput}
				placeholder={items.length === 0 ? placeholder : ""}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown(onAdd, items, () =>
					onRemove(items[items.length - 1]),
				)}
			/>
		</div>
	);

	return (
		<SlidePanel
			title={target ? "Edit Starter Prompt" : "Add Starter Prompt"}
			icon={<LightbulbRegular />}
			buttons={{
				submitLabel: saving ? "Saving…" : "Submit",
				submitDisabled: !isValid,
				onSubmit: handleSubmit,
				onCancel: onClose,
			}}
			disabled={saving}
			error={error || undefined}
			onClose={onClose}
		>
			{renderField(
				<TextDescription20Regular />,
				"Title",
				"Short label displayed on the starter prompt chip",
				<input
					className={classes.input}
					placeholder="Prompt Title"
					value={form.title}
					onChange={(e) => updateField("title", e.target.value)}
				/>,
			)}
			{renderField(
				<Bot20Regular />,
				"Agent Name",
				"The agent this prompt is associated with",
				<select
					className={classes.select}
					value={form.agentName}
					onChange={(e) => updateField("agentName", e.target.value)}
				>
					<option value="" disabled>
						Select an agent
					</option>
					{agents.map((a) => (
						<option key={a} value={a}>
							{a}
						</option>
					))}
				</select>,
			)}
			{renderField(
				<Chat20Regular />,
				"Prompt",
				"Use {paramName} to insert parameters",
				<textarea
					className={classes.textarea}
					placeholder="Search for credit requests for agreement {agreementId}"
					rows={5}
					value={form.prompt}
					onChange={(e) => handlePromptChange(e.target.value)}
				/>,
			)}
			{renderField(
				<Tag20Regular />,
				"Parameters",
				"Add parameter tags (press Enter to add)",
				renderTagsField(
					form.parameters,
					paramInput,
					setParamInput,
					addParam,
					removeParam,
					"Type a parameter and press Enter",
				),
			)}
			{renderField(
				<Tag20Regular />,
				"Tags",
				"Categorize prompts for filtering (press Enter to add)",
				renderTagsField(
					form.tags,
					tagInput,
					setTagInput,
					addTag,
					removeTag,
					"Type a tag and press Enter",
				),
			)}
			{renderField(
				<NumberSymbol20Regular />,
				"Order",
				"Lower numbers appear first in the chips list",
				<input
					className={classes.input}
					type="number"
					min={0}
					placeholder="0"
					value={form.order}
					onChange={(e) => updateField("order", e.target.value)}
				/>,
			)}
		</SlidePanel>
	);
};
