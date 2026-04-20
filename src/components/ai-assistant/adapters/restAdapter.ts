import type { IChatAdapter, ChatEvent, ISendMessageRequest } from "./types";
import type { IChatMessageData } from "../AIAssistant.types";

interface RestAdapterOptions {
	url: string;
	getToken?: () => Promise<string>;
	/** Map the API JSON response to the assistant's text. Default: `(json) => json.text ?? json.message ?? JSON.stringify(json)` */
	extractText?: (json: unknown) => string;
	/**
	 * Transform the raw API JSON response into the library's canonical data model.
	 * Return undefined to skip structured data (text-only response).
	 * Default: no data mapping — response is treated as text only.
	 */
	mapData?: (json: unknown) => IChatMessageData | undefined;
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
 * Default data mapper for REST responses.
 * Looks for common `data`/`payload` and `templateId`/`template` fields.
 * Returns undefined if no structured data is found (text-only response).
 */
const defaultMapData = (json: unknown): IChatMessageData | undefined => {
	if (typeof json !== "object" || json === null) return undefined;
	const obj = json as Record<string, unknown>;

	const payload = obj.data ?? obj.payload;
	const templateId = obj.templateId ?? obj.template;

	if (!payload && !templateId) return undefined;

	const result: IChatMessageData = {};
	if (payload) {
		result.payload =
			typeof payload === "string" ? payload : JSON.stringify(payload);
	}
	if (typeof templateId === "string") {
		result.templateId = templateId;
	}
	return result;
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
	const mapData = options.mapData ?? defaultMapData;

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
				const data = mapData(json);
				yield { type: "text-done", content: text, data };
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
