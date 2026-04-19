import {
	Theme as FluentTheme,
	webLightTheme,
	webDarkTheme,
	teamsLightTheme,
	teamsDarkTheme,
	teamsHighContrastTheme,
} from "@fluentui/react-components";

export const customWebLightTheme: FluentTheme = {
	...webLightTheme,
	colorNeutralBackground5: webLightTheme.colorBrandBackground,
	colorNeutralBackground5Hover: webLightTheme.colorBrandBackgroundHover,
	colorNeutralBackground5Pressed: webLightTheme.colorBrandBackgroundPressed,
	colorNeutralForeground4: webLightTheme.colorNeutralForegroundOnBrand,
};

export const customWebDarkTheme: FluentTheme = {
	...webDarkTheme,
	colorNeutralBackground5: "#000000",
	colorNeutralBackground5Hover: "#1a1a1a",
	colorNeutralBackground5Pressed: "#2a2a2a",
	colorNeutralForeground4: "#ffffff",
	// Icons: white in dark mode
	colorCompoundBrandForeground1: "#ffffff",
	colorCompoundBrandForeground1Hover: "#e0e0e0",
	colorCompoundBrandForeground1Pressed: "#c0c0c0",
};

export const customTeamsLightTheme: FluentTheme = {
	...teamsLightTheme,
	colorNeutralBackground5: teamsLightTheme.colorBrandBackground,
	colorNeutralBackground5Hover: teamsLightTheme.colorBrandBackgroundHover,
	colorNeutralBackground5Pressed: teamsLightTheme.colorBrandBackgroundPressed,
	colorNeutralForeground4: teamsLightTheme.colorNeutralForegroundOnBrand,
};

export const customTeamsDarkTheme: FluentTheme = {
	...teamsDarkTheme,
	colorNeutralBackground5: "#000000",
	colorNeutralBackground5Hover: "#1a1a1a",
	colorNeutralBackground5Pressed: "#2a2a2a",
	colorNeutralForeground4: "#ffffff",
	// Icons: white in dark mode
	colorCompoundBrandForeground1: "#ffffff",
	colorCompoundBrandForeground1Hover: "#e0e0e0",
	colorCompoundBrandForeground1Pressed: "#c0c0c0",
};

export const customTeamsHighContrastTheme: FluentTheme = {
	...teamsHighContrastTheme,
	colorNeutralBackground5: "#000000",
	colorNeutralBackground5Hover: "#1a1a1a",
	colorNeutralBackground5Pressed: "#2a2a2a",
	colorNeutralForeground4: "#ffffff",
	// Icons: white in high contrast mode
	colorCompoundBrandForeground1: "#ffffff",
	colorCompoundBrandForeground1Hover: "#e0e0e0",
	colorCompoundBrandForeground1Pressed: "#c0c0c0",
};
