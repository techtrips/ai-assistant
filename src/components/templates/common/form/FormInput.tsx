import React from "react";
import {
	Input,
	Textarea,
	Dropdown,
	Option,
	Checkbox,
	Switch,
	RadioGroup,
	Radio,
	SpinButton,
	makeStyles,
} from "@fluentui/react-components";
import type { IInputFieldControl, ControlValue } from "../../templates.models";
import { formStyles } from "./FormControl.styles";
import { toReactStyle } from "../common.utils";

const useStyles = makeStyles(formStyles);

export interface IFormInputProps {
	field: IInputFieldControl;
	value: ControlValue;
	error?: string;
	onChange: (name: string, value: ControlValue) => void;
}

export const FormInput: React.FC<IFormInputProps> = ({
	field,
	value,
	error,
	onChange,
}) => {
	const classes = useStyles();
	const {
		name,
		label,
		inputType,
		placeholder,
		required,
		options,
		step,
		rows,
		disabled,
		style,
	} = field;

	const renderInput = () => {
		switch (inputType) {
			case "text":
				return (
					<Input
						value={String(value ?? "")}
						placeholder={placeholder}
						disabled={disabled}
						onChange={(_, data) => onChange(name, data.value)}
					/>
				);

			case "textarea":
				return (
					<Textarea
						value={String(value ?? "")}
						placeholder={placeholder}
						disabled={disabled}
						rows={rows ?? 3}
						resize="vertical"
						onChange={(_, data) => onChange(name, data.value)}
					/>
				);

			case "number":
				return (
					<SpinButton
						value={value != null ? Number(value) : undefined}
						placeholder={placeholder}
						disabled={disabled}
						step={step ?? 1}
						onChange={(_, data) =>
							onChange(name, data.value ?? data.displayValue ?? null)
						}
					/>
				);

			case "date":
				return (
					<Input
						type="date"
						value={String(value ?? "")}
						disabled={disabled}
						onChange={(_, data) => onChange(name, data.value)}
					/>
				);

			case "dropdown":
				return (
					<Dropdown
						value={
							options?.find((o) => o.value === String(value ?? ""))?.label ??
							String(value ?? "")
						}
						selectedOptions={value != null ? [String(value)] : []}
						placeholder={placeholder ?? "Select an option"}
						disabled={disabled}
						onOptionSelect={(_, data) =>
							onChange(name, data.optionValue ?? null)
						}
					>
						{(options ?? []).map((opt) => (
							<Option key={opt.value} value={opt.value}>
								{opt.label}
							</Option>
						))}
					</Dropdown>
				);

			case "checkbox":
				return (
					<Checkbox
						checked={Boolean(value)}
						disabled={disabled}
						label={undefined}
						onChange={(_, data) => onChange(name, data.checked === true)}
					/>
				);

			case "toggle":
				return (
					<Switch
						checked={Boolean(value)}
						disabled={disabled}
						onChange={(_, data) => onChange(name, data.checked)}
					/>
				);

			case "radio":
				return (
					<RadioGroup
						value={String(value ?? "")}
						disabled={disabled}
						onChange={(_, data) => onChange(name, data.value)}
						layout="horizontal"
					>
						{(options ?? []).map((opt) => (
							<Radio key={opt.value} value={opt.value} label={opt.label} />
						))}
					</RadioGroup>
				);

			default:
				return null;
		}
	};

	return (
		<div className={classes.fieldWrapper} style={toReactStyle(style)}>
			{inputType !== "checkbox" && inputType !== "toggle" && (
				<label className={classes.label}>
					{label}
					{required && <span className={classes.required}>*</span>}
				</label>
			)}
			{(inputType === "checkbox" || inputType === "toggle") && (
				<label className={classes.label}>
					{renderInput()} {label}
					{required && <span className={classes.required}>*</span>}
				</label>
			)}
			{inputType !== "checkbox" && inputType !== "toggle" && renderInput()}
			{error && <span className={classes.error}>{error}</span>}
		</div>
	);
};
