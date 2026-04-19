import { useState, useCallback } from "react";
import { getTheme } from "./ThemeProvider.utils";
import { FluentProvider } from "@fluentui/react-components";
import { Theme, type IThemeProviderProps } from "./ThemeProvider.models";
import { ThemeContext } from "./ThemeProvider.context";

export const ThemeProvider = (props: IThemeProviderProps) => {
	const { theme, children, ...rest } = props;
	const [currentTheme, setCurrentTheme] = useState<Theme>(
		theme ?? Theme.WebLight,
	);

	const setTheme = useCallback((theme: Theme) => {
		setCurrentTheme(theme);
	}, []);

	const selectedTheme = getTheme(currentTheme);

	return (
		<ThemeContext.Provider value={{ currentTheme, setTheme }}>
			<FluentProvider
				theme={selectedTheme}
				style={{ height: "100%" }}
				{...rest}
			>
				{children}
			</FluentProvider>
		</ThemeContext.Provider>
	);
};
