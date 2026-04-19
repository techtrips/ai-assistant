import { useState, useCallback, useEffect, useRef } from "react";
import { Button, mergeClasses } from "@fluentui/react-components";
import { Dismiss12Regular, ArrowRight24Filled } from "@fluentui/react-icons";
import type { IStarterPrompt } from "../../AIAssistant.types";
import { usePromptFormStyles } from "./PromptParameterForm.styles";
import {
	resolvePrompt,
	prettifyParamName,
	isOptionalParam,
} from "./PromptParameterForm.utils";

interface IPromptParameterFormProps {
	prompt: IStarterPrompt;
	onSubmit: (resolvedPrompt: string) => void;
	onCancel: () => void;
}

export const PromptParameterForm = ({
	prompt,
	onSubmit,
	onCancel,
}: IPromptParameterFormProps) => {
	const classes = usePromptFormStyles();
	const firstInputRef = useRef<HTMLInputElement>(null);
	const parameters = prompt.parameters ?? [];
	const promptTemplate = prompt.prompt ?? prompt.title;

	const [values, setValues] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		for (const param of parameters) {
			initial[param] = "";
		}
		return initial;
	});

	useEffect(() => {
		requestAnimationFrame(() => firstInputRef.current?.focus());
	}, []);

	const handleFieldChange = useCallback((param: string, value: string) => {
		setValues((prev) => ({ ...prev, [param]: value }));
	}, []);

	const requiredParams = parameters.filter((p) => !isOptionalParam(p));
	const allRequiredFilled = requiredParams.every(
		(param) => (values[param] ?? "").trim().length > 0,
	);

	const handleSubmit = useCallback(() => {
		if (!allRequiredFilled) return;
		const resolved = resolvePrompt(promptTemplate, parameters, values);
		onSubmit(resolved);
	}, [allRequiredFilled, promptTemplate, parameters, values, onSubmit]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey && allRequiredFilled) {
				e.preventDefault();
				handleSubmit();
			}
			if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
			}
		},
		[allRequiredFilled, handleSubmit, onCancel],
	);

	if (parameters.length === 0) return null;

	return (
		<div className={classes.wrapper} onKeyDown={handleKeyDown}>
			<div className={classes.card}>
				<div className={classes.topRow}>
					<span className={classes.titleBadge}>{prompt.title}</span>
					<Button
						appearance="transparent"
						size="small"
						aria-label="Cancel"
						className={classes.dismissButton}
						icon={<Dismiss12Regular />}
						onClick={onCancel}
					/>
				</div>
				<div className={classes.fields}>
					{parameters.map((param, index) => {
						const optional = isOptionalParam(param);
						return (
						<div key={param} className={classes.fieldGroup}>
							<label className={classes.fieldLabel}>
								{prettifyParamName(param)}
								{optional ? (
									<span className={classes.optionalHint}>(optional)</span>
								) : (
									<span className={classes.requiredMark}>*</span>
								)}
							</label>
							<input
								className={classes.input}
								ref={index === 0 ? firstInputRef : undefined}
								value={values[param] ?? ""}
								onChange={(e) => handleFieldChange(param, e.target.value)}
								placeholder={`Enter ${prettifyParamName(param)}${optional ? " (optional)" : ""}`}
								autoComplete="off"
							/>
						</div>
						);
					})}
				</div>
				<div className={classes.actionBar}>
					<Button
						appearance="transparent"
						aria-label="Send"
						className={mergeClasses(
							classes.sendButton,
							allRequiredFilled && classes.sendButtonActive,
						)}
						disabled={!allRequiredFilled}
						onClick={handleSubmit}
						icon={<ArrowRight24Filled />}
					/>
				</div>
			</div>
		</div>
	);
};
