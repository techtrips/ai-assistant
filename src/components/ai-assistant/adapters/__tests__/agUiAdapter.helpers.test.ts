import {
	coerceToLabel,
	defaultMapData,
	describeResultSize,
	extractActivityLabel,
	humanizePhrase,
	humanizeToolName,
	isMcpContentBlock,
	prettifyDetail,
	tokenize,
	unwrapMcpContent,
} from "../agUiAdapter.helpers";

describe("isMcpContentBlock", () => {
	it("returns true for MCP text blocks", () => {
		expect(isMcpContentBlock({ type: "text", text: "hi" })).toBe(true);
	});
	it("returns false for non-text types", () => {
		expect(isMcpContentBlock({ type: "image", text: "x" })).toBe(false);
	});
	it("returns false for missing text", () => {
		expect(isMcpContentBlock({ type: "text" })).toBe(false);
	});
	it("returns false for null/undefined/primitives", () => {
		expect(isMcpContentBlock(null)).toBe(false);
		expect(isMcpContentBlock(undefined)).toBe(false);
		expect(isMcpContentBlock("text")).toBe(false);
	});
});

describe("unwrapMcpContent", () => {
	it("unwraps a single content block with JSON inside", () => {
		const wrapped = { type: "text", text: '{"hello":"world"}' };
		expect(unwrapMcpContent(wrapped)).toEqual({ hello: "world" });
	});

	it("returns inner string when JSON parse fails", () => {
		const wrapped = { type: "text", text: "plain text" };
		expect(unwrapMcpContent(wrapped)).toBe("plain text");
	});

	it("unwraps a single-element array of MCP blocks", () => {
		const wrapped = [{ type: "text", text: '{"a":1}' }];
		expect(unwrapMcpContent(wrapped)).toEqual({ a: 1 });
	});

	it("unwraps multi-element arrays as array of parsed values", () => {
		const wrapped = [
			{ type: "text", text: '{"a":1}' },
			{ type: "text", text: '{"b":2}' },
		];
		expect(unwrapMcpContent(wrapped)).toEqual([{ a: 1 }, { b: 2 }]);
	});

	it("joins multi-element arrays as string when not all JSON", () => {
		const wrapped = [
			{ type: "text", text: "first" },
			{ type: "text", text: "second" },
		];
		expect(unwrapMcpContent(wrapped)).toBe("first\n\nsecond");
	});

	it("returns input unchanged when not MCP shape", () => {
		expect(unwrapMcpContent({ a: 1 })).toEqual({ a: 1 });
		expect(unwrapMcpContent("plain")).toBe("plain");
		expect(unwrapMcpContent([1, 2, 3])).toEqual([1, 2, 3]);
	});
});

describe("coerceToLabel", () => {
	it("returns trimmed strings", () => {
		expect(coerceToLabel("  hello   world  ")).toBe("hello world");
	});
	it("stringifies numbers and booleans", () => {
		expect(coerceToLabel(42)).toBe("42");
		expect(coerceToLabel(true)).toBe("true");
	});
	it("prefers known label fields", () => {
		expect(coerceToLabel({ title: "T", message: "M" })).toBe("T");
		expect(coerceToLabel({ message: "M", text: "X" })).toBe("M");
		expect(coerceToLabel({ text: "X" })).toBe("X");
	});
	it("falls back to JSON for unrecognized objects", () => {
		expect(coerceToLabel({ x: 1 })).toBe('{"x":1}');
	});
	it("returns empty string for null/undefined", () => {
		expect(coerceToLabel(null)).toBe("");
		expect(coerceToLabel(undefined)).toBe("");
	});
});

describe("extractActivityLabel", () => {
	it("uses content label when available", () => {
		expect(extractActivityLabel("foo_bar", { title: "Doing the thing" })).toBe(
			"Doing the thing",
		);
	});
	it("falls back to humanized activityType", () => {
		expect(extractActivityLabel("foo_bar", undefined)).toBe("foo bar");
	});
	it("returns empty when nothing matches", () => {
		expect(extractActivityLabel(undefined, undefined)).toBe("");
	});
});

describe("tokenize", () => {
	it("splits camelCase", () => {
		expect(tokenize("getUserProfile")).toEqual(["get", "User", "Profile"]);
	});
	it("splits snake_case and kebab-case", () => {
		expect(tokenize("get_user_profile")).toEqual(["get", "user", "profile"]);
		expect(tokenize("get-user-profile")).toEqual(["get", "user", "profile"]);
	});
	it("preserves acronym boundaries", () => {
		expect(tokenize("getURLPath")).toEqual(["get", "URL", "Path"]);
	});
});

describe("humanizePhrase", () => {
	it("sentence-cases identifiers", () => {
		expect(humanizePhrase("getUserProfile")).toBe("Get user profile");
		expect(humanizePhrase("USER_NAME")).toBe("User name");
	});
	it("returns empty for empty input", () => {
		expect(humanizePhrase("")).toBe("");
	});
});

describe("humanizeToolName", () => {
	it("maps known verb prefixes", () => {
		expect(humanizeToolName("SearchTravelContent")).toBe(
			"Searching travel content",
		);
		expect(humanizeToolName("getUserProfile")).toBe("Getting user profile");
		expect(humanizeToolName("deleteRecord")).toBe("Deleting record");
	});
	it("handles A2A delegation prefix", () => {
		expect(humanizeToolName("agent_BookingAgent")).toBe(
			"Delegating to Booking agent",
		);
	});
	it("handles MCP server prefix", () => {
		expect(humanizeToolName("mcp_weather_fetchForecast")).toBe(
			"Fetching forecast",
		);
	});
	it("falls back to humanized phrase for unknown verbs", () => {
		expect(humanizeToolName("FooBar")).toBe("Foo bar");
	});
	it("returns empty for empty input", () => {
		expect(humanizeToolName("")).toBe("");
	});
});

describe("describeResultSize", () => {
	it("describes array length", () => {
		expect(describeResultSize(JSON.stringify([1, 2, 3]))).toBe("3 items");
		expect(describeResultSize(JSON.stringify([1]))).toBe("1 item");
	});
	it("describes wrapped items field", () => {
		expect(describeResultSize(JSON.stringify({ items: [1, 2] }))).toBe(
			"2 items",
		);
	});
	it("describes wrapped results field", () => {
		expect(describeResultSize(JSON.stringify({ results: [1, 2, 3] }))).toBe(
			"3 results",
		);
	});
	it("describes object field count", () => {
		expect(describeResultSize(JSON.stringify({ a: 1, b: 2 }))).toBe("2 fields");
	});
	it("describes large strings by KB", () => {
		const big = "x".repeat(500);
		expect(describeResultSize(big)).toMatch(/KB$/);
	});
	it("returns empty for short non-JSON strings", () => {
		expect(describeResultSize("short")).toBe("");
	});
	it("returns empty for empty input", () => {
		expect(describeResultSize("")).toBe("");
	});
});

describe("prettifyDetail", () => {
	it("pretty-prints JSON with 2-space indent", () => {
		expect(prettifyDetail('{"a":1}')).toBe('{\n  "a": 1\n}');
	});
	it("unwraps MCP content before pretty-printing", () => {
		const mcp = JSON.stringify({ type: "text", text: '{"a":1}' });
		expect(prettifyDetail(mcp)).toBe('{\n  "a": 1\n}');
	});
	it("returns raw text when not JSON", () => {
		expect(prettifyDetail("plain text")).toBe("plain text");
	});
	it("returns empty for empty input", () => {
		expect(prettifyDetail("")).toBe("");
	});
});

describe("defaultMapData", () => {
	it("returns empty data when no tools", () => {
		expect(defaultMapData([])).toEqual({});
	});
	it("uses first tool name as templateId and lists tools used", () => {
		const data = defaultMapData([
			{ id: "1", name: "GetWeather" },
			{ id: "2", name: "GetForecast" },
		]);
		expect(data?.templateId).toBe("GetWeather");
		expect(data?.toolsUsed).toEqual(["GetWeather", "GetForecast"]);
		expect(data?.payload).toBeUndefined();
	});
	it("serializes structured tool result as payload", () => {
		const data = defaultMapData([
			{ id: "1", name: "GetWeather", result: '{"temp":72}' },
		]);
		expect(data?.payload).toBe('{"temp":72}');
		expect(data?.templateId).toBe("GetWeather");
	});
	it("does not surface plain-string results as payload", () => {
		const data = defaultMapData([
			{ id: "1", name: "Echo", result: '"just a string"' },
		]);
		expect(data?.payload).toBeUndefined();
	});
	it("unwraps MCP envelope before serializing", () => {
		const result = JSON.stringify({
			type: "text",
			text: '{"city":"Seattle"}',
		});
		const data = defaultMapData([{ id: "1", name: "GetCity", result }]);
		expect(data?.payload).toBe('{"city":"Seattle"}');
	});
});
