import { useState, useCallback, useEffect, useRef } from "react";
import { Button, Input, mergeClasses } from "@fluentui/react-components";
import { Dismiss12Regular, ArrowRight24Filled } from "@fluentui/react-icons";
import type { IStarterPrompt } from "../../AIAssistant.types";
import { usePromptFormStyles } from "./PromptParameterForm.styles";
import { resolvePrompt, prettifyParamName } from "./PromptParameterForm.utils";

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

	const allFieldsFilled = parameters.every(
		(param) => (values[param] ?? "").trim().length > 0,
	);

	const handleSubmit = useCallback(() => {
		if (!allFieldsFilled) return;
		const resolved = resolvePrompt(promptTemplate, parameters, values);
		onSubmit(resolved);
	}, [allFieldsFilled, promptTemplate, parameters, values, onSubmit]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey && allFieldsFilled) {
				e.preventDefault();
				handleSubmit();
			}
			if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
			}
		},
		[allFieldsFilled, handleSubmit, onCancel],
	);

	if (parameters.length === 0) return null;

	const lastIndex = parameters.length - 1;

	return (
		<div className={classes.wrapper} onKeyDown={handleKeyDown}>
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
				{parameters.map((param, index) => (
					<div key={param} className={classes.inputRow}>
						<div className={classes.inputGrow}>
							<Input
								className={classes.input}
								size="medium"
								value={values[param] ?? ""}
								onChange={(_, data) => handleFieldChange(param, data.value)}
								placeholder={`Enter ${prettifyParamName(param)}`}
								autoComplete="off"
								appearance="filled-lighter"
								input={{ ref: index === 0 ? firstInputRef : undefined }}
							/>
						</div>
						{index === lastIndex ? (
							<Button
								appearance="transparent"
								aria-label="Send"
								className={mergeClasses(
									classes.sendButton,
									allFieldsFilled && classes.sendButtonActive,
								)}
								disabled={!allFieldsFilled}
								onClick={handleSubmit}
								icon={<ArrowRight24Filled />}
							/>
						) : (
							<div className={classes.sendButtonSpacer} />
						)}
					</div>
				))}
			</div>
		</div>
	);
};
