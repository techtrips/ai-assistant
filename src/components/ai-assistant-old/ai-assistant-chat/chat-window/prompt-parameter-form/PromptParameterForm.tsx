import { useState, useCallback, useEffect, useRef } from "react";
import { Button, mergeClasses } from "@fluentui/react-components";
import { Dismiss12Regular, ArrowRight24Filled } from "@fluentui/react-icons";
import type { IPromptParameterFormProps } from "./PromptParameterForm.models";
import { usePromptFormStyles } from "./PromptParameterForm.styles";
import { resolvePrompt } from "./PromptParameterForm.utils";
import { getFieldRenderer } from "./ParameterField";

export const PromptParameterForm = ({
	open,
	title,
	promptTemplate,
	parameters,
	templateType,
	onSubmit,
	onCancel,
}: IPromptParameterFormProps) => {
	const classes = usePromptFormStyles();
	const firstInputRef = useRef<HTMLInputElement>(null);

	const [values, setValues] = useState<Record<string, string>>({});

	useEffect(() => {
		if (open) {
			const initial: Record<string, string> = {};
			for (const param of parameters) {
				initial[param] = "";
			}
			setValues(initial);
			requestAnimationFrame(() => firstInputRef.current?.focus());
		}
	}, [open, parameters]);

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

	const FieldComponent = getFieldRenderer(templateType);

	if (!open || !FieldComponent) return null;

	const lastIndex = parameters.length - 1;

	return (
		<div className={classes.wrapper} onKeyDown={handleKeyDown}>
			<div className={classes.topRow}>
				<span className={classes.titleBadge}>{title}</span>
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
							<FieldComponent
								name={param}
								value={values[param] ?? ""}
								onChange={(val) => handleFieldChange(param, val)}
								inputRef={index === 0 ? firstInputRef : undefined}
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
