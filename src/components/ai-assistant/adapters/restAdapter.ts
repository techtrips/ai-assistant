import type { IChatMessageData } from "../AIAssistant.types";
import { buildAuthHeaders, httpStatusToErrorCode } from "./http";
import { type ChatErrorCodeLike } from "./types";
import type { ChatEvent, IChatAdapter, ISendMessageRequest } from "./types";

interface RestErrorContext {
	status: number;
	body: string;
	request: ISendMessageRequest;
}

interface RestErrorMapping {
	message: string;
	code?: ChatErrorCodeLike;
	data?: Record<string, unknown>;
}

interface RestAdapterOptions {
	url: string;
	getToken?: () => Promise<string>;
	/**
	 * Build the JSON body to POST. Default:
	 * `{ threadId, messageId, message, model }`.
	 * Override to plug in custom envelopes (e.g. `{ input }`, registry ids, etc.).
	 */
	mapBody?: (request: ISendMessageRequest) => unknown;
	/** Map the API JSON response to the assistant's text. Default: `(json) => json.text ?? json.message ?? JSON.stringify(json)` */
	extractText?: (json: unknown) => string;
	/**
	 * Transform the raw API JSON response into the library's canonical data model.
	 * Return undefined to skip structured data (text-only response).
	 * Default: maps `data`/`payload` and `templateId`/`template` shorthand fields.
	 */
	mapData?: (json: unknown) => IChatMessageData | undefined;
	/**
	 * Convert a non-OK HTTP response into a structured error event. Useful
	 * for surfacing `ChatErrorCode.AuthRequired` on 401/403 with consumer-
	 * specific scope/data fields. Default: emits a generic error with the
	 * response body or status text.
	 */
	mapError?: (ctx: RestErrorContext) => RestErrorMapping;
	/** Optional extra headers to merge into the request. */
	headers?: Record<string, string>;
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
	const mapBody =
		options.mapBody ??
		((request: ISendMessageRequest) => ({
			threadId: request.threadId,
			messageId: request.messageId,
			message: request.message,
			model: request.model,
			history: request.history,
		}));

	return {
		async *sendMessage(
			request: ISendMessageRequest,
		): AsyncGenerator<ChatEvent> {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				...(await buildAuthHeaders(options.getToken)),
				...(options.headers ?? {}),
			};

			try {
				const response = await fetch(options.url, {
					method: "POST",
					headers,
					body: JSON.stringify(mapBody(request)),
					signal: request.abortSignal,
				});

				if (!response.ok) {
					const body = await response.text().catch(() => "");
					if (options.mapError) {
						const mapped = options.mapError({
							status: response.status,
							body,
							request,
						});
						yield { type: "error", ...mapped };
						return;
					}
					yield {
						type: "error",
						message: body || `HTTP ${response.status} ${response.statusText}`,
						code: httpStatusToErrorCode(response.status),
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
