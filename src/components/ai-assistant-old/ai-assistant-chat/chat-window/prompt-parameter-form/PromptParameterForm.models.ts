export const PromptTemplateType = {
	PlaceholderText: "placeholder_text",
} as const;

export type PromptTemplateTypeValue =
	(typeof PromptTemplateType)[keyof typeof PromptTemplateType];

export interface IPromptParameterFormProps {
	open: boolean;
	title: string;
	promptTemplate: string;
	parameters: string[];
	templateType: string;
	onSubmit: (resolvedPrompt: string) => void;
	onCancel: () => void;
}

export interface IParameterFieldProps {
	name: string;
	value: string;
	onChange: (value: string) => void;
	inputRef?: React.Ref<HTMLInputElement>;
}
