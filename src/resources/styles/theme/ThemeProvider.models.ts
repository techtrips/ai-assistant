export enum Theme {
	WebLight = "webLight",
	WebDark = "webDark",
	TeamsLight = "teamsLight",
	TeamsDark = "teamsDark",
	TeamsHighContrast = "teamsHighContrast",
}

export interface IThemeContextValue {
	currentTheme: Theme;
	setTheme: (theme: Theme) => void;
}

export interface IThemeProviderProps {
	theme?: Theme;
	children?: React.ReactNode;
	style?: React.CSSProperties;
	className?: string;
}
