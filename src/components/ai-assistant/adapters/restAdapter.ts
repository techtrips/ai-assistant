import type { IChatAdapter, ChatEvent, ISendMessageRequest } from "./types";

interface RestAdapterOptions {
	url: string;
	getToken?: () => Promise<string>;
	/** Map the API JSON response to the assistant's text. Default: `(json) => json.text ?? json.message ?? JSON.stringify(json)` */
	extractText?: (json: unknown) => string;
}

const defaultExtractText = (json: unknown): string => {
	if (typeof json === "object" && json !== null) {
		const obj = json as Record<string, unknown>;
		if (typeof obj.text === "string") return obj.text;
		if (typeof obj.message === "string") return obj.message;
		if (typeof obj.response === "string") return obj.response;
	}
	return JSON.stringify(json);
};

/**
 * Creates a ChatAdapter backed by a simple REST POST endpoint.
 *
 * Usage:
 * ```ts
 * const adapter = restAdapter({ url: "/api/chat", getToken });
 * ```
 */
export const restAdapter = (options: RestAdapterOptions): IChatAdapter => {
	const extractText = options.extractText ?? defaultExtractText;

	return {
		async *sendMessage(
			request: ISendMessageRequest,
		): AsyncGenerator<ChatEvent> {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};

			if (options.getToken) {
				const token = await options.getToken().catch(() => "");
				if (token) {
					headers.Authorization = `Bearer ${token}`;
				}
			}

			try {
				const response = await fetch(options.url, {
					method: "POST",
					headers,
					body: JSON.stringify({
						threadId: request.threadId,
						messageId: request.messageId,
						message: request.message,
						model: request.model,
					}),
					signal: request.abortSignal,
				});

				if (!response.ok) {
					const body = await response.text().catch(() => "");
					yield {
						type: "error",
						message: body || `HTTP ${response.status} ${response.statusText}`,
					};
					return;
				}

				const json = await response.json();
				const text = extractText(json);
				yield { type: "text-done", content: text };
			} catch (err: unknown) {
				if (err instanceof Error && err.name === "AbortError") return;
				yield {
					type: "error",
					message:
						err instanceof Error ? err.message : "Unknown error occurred",
				};
			}
		},
	};
};
