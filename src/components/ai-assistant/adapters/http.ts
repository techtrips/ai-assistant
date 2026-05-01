/**
 * Shared HTTP utilities used by the bundled adapters. Keeping these in
 * one place avoids drift between `restAdapter` and `agUiAdapter` (and
 * any future custom adapter) when conventions like Bearer-token
 * resolution or non-OK error mapping change.
 */
import { ChatErrorCode, type ChatErrorCodeLike } from "./types";

export type GetTokenFn = () => Promise<string>;

/**
 * Resolve a Bearer token to an `Authorization` header. Failures are
 * swallowed so that callers can still attempt anonymous requests
 * (the server will respond with 401 if auth is actually required).
 */
export const buildAuthHeaders = async (
	getToken: GetTokenFn | undefined,
): Promise<Record<string, string>> => {
	if (!getToken) return {};
	const token = await getToken().catch(() => "");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map a non-OK HTTP status to a canonical ChatErrorCode.
 * 401 / 403 → `AuthRequired`, otherwise undefined.
 */
export const httpStatusToErrorCode = (
	status: number,
): ChatErrorCodeLike | undefined =>
	status === 401 || status === 403 ? ChatErrorCode.AuthRequired : undefined;
