import { Theme } from "./ThemeProvider.models";
import {
	customWebLightTheme,
	customWebDarkTheme,
	customTeamsLightTheme,
	customTeamsDarkTheme,
	customTeamsHighContrastTheme,
} from "./customeThemes";

export const getTheme = (themeType?: Theme) => {
	switch (themeType) {
		case Theme.WebLight:
			return customWebLightTheme;
		case Theme.WebDark:
			return customWebDarkTheme;
		case Theme.TeamsLight:
			return customTeamsLightTheme;
		case Theme.TeamsDark:
			return customTeamsDarkTheme;
		case Theme.TeamsHighContrast:
			return customTeamsHighContrastTheme;
		default:
			return customWebLightTheme;
	}
};
