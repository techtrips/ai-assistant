import {
	useCallback,
	useEffect,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { IStarterPrompt } from "../../AIAssistant.types";
import {
	extractParameters,
	normalizeList,
	initialFormState,
	type IStarterPromptFormState,
} from "./StarterPrompts.models";

export const useStarterPromptForm = (
	target: IStarterPrompt | null,
	agents: string[],
	onSave: (prompt: IStarterPrompt) => Promise<void>,
) => {
	const [form, setForm] = useState<IStarterPromptFormState>(
		initialFormState(agents),
	);
	const [paramInput, setParamInput] = useState("");
	const [tagInput, setTagInput] = useState("");

	useEffect(() => {
		if (target) {
			// Extract params from prompt text (with ? suffix for optionality)
			const fromPrompt = extractParameters(target.prompt ?? "");
			const fromPromptBases = new Set(
				fromPrompt.map((p) => p.replace(/\?$/, "").toLowerCase()),
			);
			// Keep stored params not already detected from the prompt text
			const stored = normalizeList(target.parameters).filter(
				(p) => !fromPromptBases.has(p.replace(/\?$/, "").toLowerCase()),
			);
			// Strip ? from all for display; optionality lives in prompt text
			const allBases = [...fromPrompt, ...stored].map((p) =>
				p.replace(/\?$/, ""),
			);
			const params = [...new Set(allBases)];
			setForm({
				title: target.title,
				agentName: target.agentName?.trim() ?? agents[0] ?? "",
				prompt: target.prompt ?? target.description ?? "",
				parameters: params,
				tags: normalizeList(target.tags),
				order: target.order ?? 0,
			});
		} else {
			setForm(initialFormState(agents));
		}
	}, [target, agents]);

	const isValid =
		form.title.trim() && form.prompt.trim() && form.agentName.trim();

	const updateField = (field: keyof IStarterPromptFormState, value: string) =>
		setForm((prev) => ({
			...prev,
			[field]: field === "order" ? (Number.parseInt(value, 10) || 0) : value,
		}));

	const handlePromptChange = (value: string) => {
		const detected = extractParameters(value);
		setForm((prev) => {
			const detectedBases = detected.map((p) =>
				p.replace(/\?$/, ""),
			);
			const detectedSet = new Set(
				detectedBases.map((b) => b.toLowerCase()),
			);
			// Keep manually-added params that are NOT in the prompt text
			const manual = prev.parameters.filter(
				(p) => !detectedSet.has(p.toLowerCase()),
			);
			// Store base names only (no ?); optionality lives in the prompt text
			const unique = [...new Set(detectedBases.map((b) => b))];
			const merged = [...unique, ...manual];
			return { ...prev, prompt: value, parameters: merged };
		});
	};

	const addParam = () => {
		const raw = paramInput.trim();
		const base = raw.replace(/\?$/, "").replace(/[^\w]/g, "_");
		if (!base) return;
		setForm((prev) => {
			if (prev.parameters.some((x) => x.toLowerCase() === base.toLowerCase()))
				return prev;
			return { ...prev, parameters: [...prev.parameters, base] };
		});
		setParamInput("");
	};

	const removeParam = (param: string) =>
		setForm((prev) => ({
			...prev,
			parameters: prev.parameters.filter(
				(x) => x.toLowerCase() !== param.toLowerCase(),
			),
		}));

	const addTag = () => {
		const t = tagInput.trim();
		if (!t) return;
		setForm((prev) => {
			if (prev.tags.some((x) => x.toLowerCase() === t.toLowerCase()))
				return prev;
			return { ...prev, tags: [...prev.tags, t] };
		});
		setTagInput("");
	};

	const removeTag = (tag: string) =>
		setForm((prev) => ({
			...prev,
			tags: prev.tags.filter((x) => x.toLowerCase() !== tag.toLowerCase()),
		}));

	const handleKeyDown =
		(onAdd: () => void, items: string[], onRemoveLast: () => void) =>
		(e: ReactKeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				onAdd();
			}
			if (
				e.key === "Backspace" &&
				(e.target as HTMLInputElement).value === "" &&
				items.length > 0
			) {
				e.preventDefault();
				onRemoveLast();
			}
		};

	const handleSubmit = useCallback(async () => {
		if (!isValid) return;
		// Extract params from prompt text (preserves ? suffix for optionality)
		const fromPrompt = extractParameters(form.prompt);
		const fromPromptBases = new Set(
			fromPrompt.map((p) => p.replace(/\?$/, "").toLowerCase()),
		);
		// Keep manually-added params not present in the prompt text
		const manual = form.parameters.filter(
			(p) => !fromPromptBases.has(p.toLowerCase()),
		);
		const allParams = normalizeList([...fromPrompt, ...manual]);
		await onSave({
			...target,
			title: form.title.trim(),
			agentName: form.agentName.trim(),
			prompt: form.prompt.trim(),
			description: form.prompt.trim(),
			parameters: allParams.length > 0 ? allParams : null,
			tags: form.tags.length > 0 ? form.tags : null,
			order: form.order,
		});
	}, [form, target, isValid, onSave]);

	return {
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
	};
};
