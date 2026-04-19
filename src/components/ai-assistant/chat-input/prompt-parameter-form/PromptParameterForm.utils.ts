export const prettifyParamName = (name: string): string => {
	const clean = name.replace(/\?$/, "");
	const words = clean
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_-]/g, " ")
		.split(/\s+/);

	return words
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
};

export const isOptionalParam = (name: string): boolean => name.endsWith("?");

export const resolvePrompt = (
	template: string,
	parameters: string[],
	values: Record<string, string>,
): string => {
	let resolved = template;
	for (const param of parameters) {
		const value = (values[param] ?? "").trim();
		const pattern = new RegExp(`\\{${param.replace("?", "\\?")}\\}`, "gi");
		resolved = resolved.replace(pattern, value);
	}
	return resolved.replace(/\s{2,}/g, " ").trim();
};
