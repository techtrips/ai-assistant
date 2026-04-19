import { createContext, useContext } from "react";

import type { IThemeContextValue } from "./ThemeProvider.models";

export const ThemeContext = createContext<IThemeContextValue | undefined>(
	undefined,
);

export const useTheme = (): IThemeContextValue => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
