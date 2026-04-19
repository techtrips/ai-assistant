export const prettifyParamName = (name: string): string => {
	const words = name
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_-]/g, " ")
		.split(/\s+/);

	return words
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
};

export const resolvePrompt = (
	template: string,
	parameters: string[],
	values: Record<string, string>,
): string => {
	let resolved = template;
	for (const param of parameters) {
		const pattern = new RegExp(`\\{${param}\\}`, "gi");
		resolved = resolved.replace(pattern, values[param] ?? "");
	}
	return resolved;
};
