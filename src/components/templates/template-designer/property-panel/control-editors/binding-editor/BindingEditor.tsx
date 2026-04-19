import { useMemo, useState } from "react";
import { Input, Combobox, Option } from "@fluentui/react-components";

export const BindingEditor = ({
	value,
	placeholder,
	bindingPaths,
	onChange,
}: {
	value: string;
	placeholder?: string;
	bindingPaths: string[];
	onChange: (value: string) => void;
}) => {
	const [inputText, setInputText] = useState(value);
	const [open, setOpen] = useState(false);

	// Sync external value changes (e.g. when a different element is selected)
	const prevValue = useMemo(() => ({ v: value }), [value]);
	if (prevValue.v !== value && inputText !== value) {
		setInputText(value);
	}

	const filteredPaths = useMemo(() => {
		if (!inputText || inputText === value) return bindingPaths;
		const lower = inputText.toLowerCase();
		return bindingPaths.filter((p) => p.toLowerCase().includes(lower));
	}, [bindingPaths, inputText, value]);

	if (bindingPaths.length === 0) {
		return (
			<Input
				size="small"
				placeholder={placeholder}
				value={value}
				onChange={(_, d) => onChange(d.value)}
			/>
		);
	}

	return (
		<Combobox
			size="small"
			freeform
			placeholder={placeholder}
			value={inputText}
			selectedOptions={value && bindingPaths.includes(value) ? [value] : []}
			open={open}
			onOpenChange={(_, d) => setOpen(d.open)}
			onChange={(e) => {
				const text = (e.target as HTMLInputElement).value;
				setInputText(text);
				setOpen(true);
			}}
			onOptionSelect={(_, d) => {
				if (d.optionValue !== undefined) {
					setInputText(d.optionValue);
					onChange(d.optionValue);
					setOpen(false);
				}
			}}
			onBlur={() => {
				if (inputText !== value) {
					onChange(inputText);
				}
			}}
		>
			{filteredPaths.map((p) => (
				<Option key={p} value={p}>
					{p}
				</Option>
			))}
			{filteredPaths.length === 0 && (
				<Option disabled value="">
					No matching paths
				</Option>
			)}
		</Combobox>
	);
};
