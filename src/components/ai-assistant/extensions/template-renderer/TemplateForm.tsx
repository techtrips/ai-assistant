import { useEffect, useState } from "react";
import { DocumentRegular } from "@fluentui/react-icons";
import { SlidePanel } from "../shared/slide-panel";
import type { ITemplate } from "../../AIAssistant.types";
import { useTemplateFormStyles } from "./TemplateForm.styles";

interface TemplateFormProps {
	target: ITemplate | null;
	agentNames: string[];
	fetchToolsForAgent: (agent: string) => Promise<string[]>;
	saving: boolean;
	error: string;
	onSave: (t: ITemplate) => Promise<void>;
	onClose: () => void;
}

interface FormState {
	name: string;
	description: string;
	agent: string;
}

export const TemplateForm = ({
	target,
	agentNames,
	fetchToolsForAgent,
	saving,
	error,
	onSave,
	onClose,
}: TemplateFormProps) => {
	const classes = useTemplateFormStyles();
	const [form, setForm] = useState<FormState>({
		name: "",
		description: "",
		agent: "",
	});
	const [availableTools, setAvailableTools] = useState<string[]>([]);
	const [loadingTools, setLoadingTools] = useState(false);

	useEffect(() => {
		if (target) {
			setForm({
				name: target.name,
				description: target.description ?? "",
				agent: target.agent ?? "",
			});
		} else {
			setForm({ name: "", description: "", agent: "" });
			setAvailableTools([]);
		}
	}, [target]);

	const handleAgentChange = async (agent: string) => {
		setForm((prev) => ({ ...prev, agent, name: "" }));
		if (!agent) {
			setAvailableTools([]);
			return;
		}
		setLoadingTools(true);
		const tools = await fetchToolsForAgent(agent);
		setAvailableTools(tools);
		setLoadingTools(false);
	};

	const isValid = form.name.trim().length > 0 && form.agent.trim().length > 0;

	const handleSubmit = async () => {
		if (!isValid) return;
		await onSave({
			...target,
			name: form.name.trim(),
			description: form.description.trim() || undefined,
			agent: form.agent.trim(),
		});
	};

	return (
		<SlidePanel
			title={target ? "Edit Template" : "Add Template"}
			icon={<DocumentRegular />}
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
			<div className={classes.formField}>
				<div className={classes.fieldTitle}>Agent</div>
				<div className={classes.fieldDescription}>
					Select the agent this template belongs to
				</div>
				{target ? (
					<input
						className={classes.input}
						value={form.agent}
						disabled
					/>
				) : (
					<select
						className={classes.input}
						value={form.agent}
						onChange={(e) => handleAgentChange(e.target.value)}
					>
						<option value="">— Select an agent —</option>
						{agentNames.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				)}
			</div>
			<div className={classes.formField}>
				<div className={classes.fieldTitle}>Tool</div>
				<div className={classes.fieldDescription}>
					Select the agent tool this template renders
				</div>
				{target ? (
					<input
						className={classes.input}
						value={form.name}
						disabled
					/>
				) : (
					<select
						className={classes.input}
						value={form.name}
						disabled={!form.agent || loadingTools}
						onChange={(e) =>
							setForm((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
					>
						<option value="">
							{loadingTools
								? "Loading tools…"
								: !form.agent
									? "— Select an agent first —"
									: "— Select a tool —"}
						</option>
						{availableTools.map((tool) => (
							<option key={tool} value={tool}>
								{tool}
							</option>
						))}
					</select>
				)}
			</div>
			<div className={classes.formField}>
				<div className={classes.fieldTitle}>Description</div>
				<div className={classes.fieldDescription}>
					Brief description of what this template renders
				</div>
				<textarea
					className={classes.textarea}
					placeholder="Renders a summary card for…"
					rows={3}
					value={form.description}
					onChange={(e) =>
						setForm((prev) => ({
							...prev,
							description: e.target.value,
						}))
					}
				/>
			</div>
		</SlidePanel>
	);
};
