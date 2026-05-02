/**
 * Shared HTTP utilities used by the bundled adapters. Keeping these in
 * one place avoids drift between `restAdapter` and `agUiAdapter` (and
 * any future custom adapter) when conventions like Bearer-token
 * resolution or non-OK error mapping change.
 */
import { ChatErrorCode, type ChatErrorCodeLike } from "./types";

export type GetTokenFn = () => Promise<string>;

/**
 * Resolve a Bearer token to an `Authorization` header. Failures invoke
 * the optional `onError` hook so consumers can react (re-auth, telemetry)
 * and then return an empty header object so anonymous-allowed endpoints
 * can still proceed (the server will respond with 401 otherwise).
 */
export const buildAuthHeaders = async (
	getToken: GetTokenFn | undefined,
	onError?: (error: unknown) => void,
): Promise<Record<string, string>> => {
	if (!getToken) return {};
	try {
		const token = await getToken();
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch (err) {
		onError?.(err);
		return {};
	}
};

/**
 * Map a non-OK HTTP status to a canonical ChatErrorCode.
 * 401 / 403 → `AuthRequired`, otherwise undefined.
 */
export const httpStatusToErrorCode = (
	status: number,
): ChatErrorCodeLike | undefined =>
	status === 401 || status === 403 ? ChatErrorCode.AuthRequired : undefined;
