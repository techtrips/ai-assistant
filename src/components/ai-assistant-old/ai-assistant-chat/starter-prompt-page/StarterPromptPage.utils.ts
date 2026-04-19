export const createInitialFormState = (
	defaultAgentName = "",
): {
	agentName: string;
	parameters: string[];
	prompt: string;
	tags: string[];
	title: string;
} => ({
	agentName: defaultAgentName,
	parameters: [],
	prompt: "",
	tags: [],
	title: "",
});

export const normalizeParameterName = (value: string): string => {
	return value
		.trim()
		.replace(/^\{+|\}+$/g, "")
		.replace(/\s+/g, "_")
		.replace(/[^\w]/g, "");
};

export const normalizeStringList = (values?: string[] | null): string[] => {
	if (!values) {
		return [];
	}

	return values
		.map((value) => value.trim())
		.filter(
			(value, index, array) =>
				value.length > 0 && array.indexOf(value) === index,
		);
};

export interface IParameterSuggestionContext {
	triggerStart: number;
	cursor: number;
	query: string;
}

export interface IParameterSuggestionPosition {
	top: number;
	left: number;
}

export const PARAMETER_SUGGESTION_WIDTH = 220;

export const PARAMETER_SUGGESTION_MAX_HEIGHT = 140;

export const mergeUniqueParameters = (
	existing: string[],
	incoming: string[],
): string[] => {
	const merged = [...existing];
	let changed = false;

	for (const parameter of incoming) {
		const normalized = normalizeParameterName(parameter);

		if (!normalized) {
			continue;
		}

		if (
			!merged.some((value) => value.toLowerCase() === normalized.toLowerCase())
		) {
			merged.push(normalized);
			changed = true;
		}
	}

	return changed ? merged : existing;
};

export const getParameterSuggestionContext = (
	promptValue: string,
	caretPosition: number,
): IParameterSuggestionContext | null => {
	if (caretPosition < 0 || caretPosition > promptValue.length) {
		return null;
	}

	const beforeCursor = promptValue.slice(0, caretPosition);
	const triggerStart = beforeCursor.lastIndexOf("{");

	if (triggerStart < 0) {
		return null;
	}

	const previousClosingBrace = beforeCursor.lastIndexOf("}");

	if (previousClosingBrace > triggerStart) {
		return null;
	}

	const query = beforeCursor.slice(triggerStart + 1);

	if (!/^\w*$/.test(query)) {
		return null;
	}

	return {
		triggerStart,
		cursor: caretPosition,
		query,
	};
};

export const getTextAreaCaretCoordinates = (
	textArea: HTMLTextAreaElement,
	position: number,
): { top: number; left: number; lineHeight: number } => {
	const mirror = document.createElement("div");
	const style = window.getComputedStyle(textArea);

	const mirroredProperties = [
		"box-sizing",
		"width",
		"height",
		"overflow-x",
		"overflow-y",
		"border-top-width",
		"border-right-width",
		"border-bottom-width",
		"border-left-width",
		"padding-top",
		"padding-right",
		"padding-bottom",
		"padding-left",
		"font-style",
		"font-variant",
		"font-weight",
		"font-stretch",
		"font-size",
		"line-height",
		"font-family",
		"letter-spacing",
		"text-transform",
		"text-indent",
		"text-decoration",
		"tab-size",
		"text-align",
		"white-space",
		"word-break",
		"overflow-wrap",
	];

	for (const property of mirroredProperties) {
		mirror.style.setProperty(property, style.getPropertyValue(property));
	}

	mirror.style.position = "absolute";
	mirror.style.visibility = "hidden";
	mirror.style.whiteSpace = "pre-wrap";
	mirror.style.wordBreak = "break-word";
	mirror.style.overflow = "hidden";
	mirror.style.top = "0";
	mirror.style.left = "-9999px";

	mirror.textContent = textArea.value.slice(0, position);

	const caretMarker = document.createElement("span");
	caretMarker.textContent = textArea.value.slice(position) || " ";
	mirror.appendChild(caretMarker);

	document.body.appendChild(mirror);

	const lineHeight = Number.parseFloat(style.lineHeight) || 20;
	const top = caretMarker.offsetTop;
	const left = caretMarker.offsetLeft;

	document.body.removeChild(mirror);

	return { top, left, lineHeight };
};

export const includesValue = (values: string[], candidate: string): boolean => {
	return values.some(
		(value) => value.toLowerCase() === candidate.toLowerCase(),
	);
};

export const extractParameters = (promptText: string): string[] => {
	const matches = promptText.match(/\{([^{}]+)\}/g);

	if (!matches) {
		return [];
	}

	return matches
		.map((match) => normalizeParameterName(match.slice(1, -1)))
		.filter(
			(value, index, array) =>
				value.length > 0 && array.indexOf(value) === index,
		);
};

export const removeParameterPlaceholders = (
	promptText: string,
	parameter: string,
): string => {
	const escapedParameter = parameter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	return promptText
		.replace(new RegExp(`\\{${escapedParameter}\\}`, "gi"), "")
		.replace(/\s{2,}/g, " ")
		.trim();
};

export const getPromptPreview = (
	promptText: string,
	fallbackText?: string,
): string => {
	const normalizedPrompt = promptText.trim();

	if (normalizedPrompt) {
		return normalizedPrompt;
	}

	return fallbackText?.trim() ?? "";
};
