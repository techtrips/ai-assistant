import { useEffect, useState } from "react";
import { DocumentRegular } from "@fluentui/react-icons";
import { SlidePanel } from "../shared/slide-panel";
import type { ITemplate } from "../../AIAssistant.types";
import { useTemplateFormStyles } from "./TemplateForm.styles";

interface TemplateFormProps {
	target: ITemplate | null;
	availableAgents: string[];
	saving: boolean;
	error: string;
	onSave: (t: ITemplate) => Promise<void>;
	onClose: () => void;
}

interface FormState {
	name: string;
	description: string;
	agents: string[];
}

export const TemplateForm = ({
	target,
	availableAgents,
	saving,
	error,
	onSave,
	onClose,
}: TemplateFormProps) => {
	const classes = useTemplateFormStyles();
	const [form, setForm] = useState<FormState>({
		name: "",
		description: "",
		agents: [],
	});

	useEffect(() => {
		if (target) {
			setForm({
				name: target.name,
				description: target.description ?? "",
				agents: target.agents ?? [],
			});
		} else {
			setForm({ name: "", description: "", agents: [] });
		}
	}, [target]);

	const isValid = form.name.trim().length > 0;

	const toggleAgent = (agent: string) => {
		setForm((prev) => ({
			...prev,
			agents: prev.agents.includes(agent)
				? prev.agents.filter((a) => a !== agent)
				: [...prev.agents, agent],
		}));
	};

	const handleSubmit = async () => {
		if (!isValid) return;
		await onSave({
			...target,
			name: form.name.trim(),
			description: form.description.trim() || undefined,
			agents: form.agents,
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
				<div className={classes.fieldTitle}>Name</div>
				<div className={classes.fieldDescription}>
					A unique name for this template
				</div>
				<input
					className={classes.input}
					placeholder="My Template"
					value={form.name}
					onChange={(e) =>
						setForm((prev) => ({
							...prev,
							name: e.target.value,
						}))
					}
				/>
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
			{availableAgents.length > 0 && (
				<div className={classes.formField}>
					<div className={classes.fieldTitle}>Agents</div>
					<div className={classes.fieldDescription}>
						Select which agents can use this template
					</div>
					<div className={classes.agentCheckboxes}>
						{availableAgents.map((agent) => (
							<label key={agent} className={classes.agentCheckbox}>
								<input
									type="checkbox"
									checked={form.agents.includes(agent)}
									onChange={() => toggleAgent(agent)}
								/>
								{agent}
							</label>
						))}
					</div>
				</div>
			)}
		</SlidePanel>
	);
};
