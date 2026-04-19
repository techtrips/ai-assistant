export function extractParameters(text: string): string[] {
	const matches = text.match(/\{(\w+\??)\}/g);
	if (!matches) return [];
	return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

export function normalizeList(values?: string[] | null): string[] {
	if (!values) return [];
	return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export interface IStarterPromptFormState {
	title: string;
	agentName: string;
	prompt: string;
	parameters: string[];
	tags: string[];
	order: number;
}

export const initialFormState = (
	agents: string[],
): IStarterPromptFormState => ({
	title: "",
	agentName: agents[0] ?? "",
	prompt: "",
	parameters: [],
	tags: [],
	order: 0,
});
