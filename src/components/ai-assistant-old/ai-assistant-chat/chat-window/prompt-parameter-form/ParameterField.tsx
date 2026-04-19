import type { FC } from "react";
import { Input } from "@fluentui/react-components";
import type { IParameterFieldProps } from "./PromptParameterForm.models";
import { PromptTemplateType } from "./PromptParameterForm.models";
import { useFieldStyles } from "./PromptParameterForm.styles";
import { prettifyParamName } from "./PromptParameterForm.utils";

const PlaceholderTextField: FC<IParameterFieldProps> = ({
	name,
	value,
	onChange,
	inputRef,
}) => {
	const classes = useFieldStyles();
	const label = prettifyParamName(name);

	return (
		<Input
			className={classes.input}
			size="medium"
			value={value}
			onChange={(_, data) => onChange(data.value)}
			placeholder={`Enter ${label}`}
			autoComplete="off"
			appearance="filled-lighter"
			input={{ ref: inputRef }}
		/>
	);
};

const fieldRenderers: Record<string, FC<IParameterFieldProps> | undefined> = {
	[PromptTemplateType.PlaceholderText]: PlaceholderTextField,
};

export const getFieldRenderer = (
	templateType: string,
): FC<IParameterFieldProps> | undefined => {
	return fieldRenderers[templateType];
};
