import { buildAuthHeaders, httpStatusToErrorCode } from "../http";
import { ChatErrorCode } from "../types";

describe("httpStatusToErrorCode", () => {
	it("maps 401 → AuthRequired", () => {
		expect(httpStatusToErrorCode(401)).toBe(ChatErrorCode.AuthRequired);
	});
	it("maps 403 → AuthRequired", () => {
		expect(httpStatusToErrorCode(403)).toBe(ChatErrorCode.AuthRequired);
	});
	it("returns undefined for other statuses", () => {
		expect(httpStatusToErrorCode(200)).toBeUndefined();
		expect(httpStatusToErrorCode(404)).toBeUndefined();
		expect(httpStatusToErrorCode(500)).toBeUndefined();
	});
});

describe("buildAuthHeaders", () => {
	it("returns empty object when no token resolver", async () => {
		expect(await buildAuthHeaders(undefined)).toEqual({});
	});

	it("returns Bearer header when token resolves", async () => {
		const headers = await buildAuthHeaders(async () => "abc123");
		expect(headers).toEqual({ Authorization: "Bearer abc123" });
	});

	it("returns empty object when token resolver returns empty string", async () => {
		expect(await buildAuthHeaders(async () => "")).toEqual({});
	});

	it("invokes onError when getToken rejects, then returns empty object", async () => {
		const onError = jest.fn();
		const err = new Error("token fetch failed");
		const result = await buildAuthHeaders(async () => {
			throw err;
		}, onError);
		expect(onError).toHaveBeenCalledWith(err);
		expect(result).toEqual({});
	});

	it("does not throw when onError is not provided and getToken rejects", async () => {
		const result = await buildAuthHeaders(async () => {
			throw new Error("nope");
		});
		expect(result).toEqual({});
	});
});
