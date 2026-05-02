/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
	moduleNameMapper: {
		"\\.(css|less|scss|sass)$": "<rootDir>/jest.styleMock.js",
	},
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: {
					jsx: "react-jsx",
					esModuleInterop: true,
					module: "commonjs",
					target: "es2020",
					moduleResolution: "node",
					skipLibCheck: true,
					strict: true,
				},
			},
		],
	},
	clearMocks: true,
};
