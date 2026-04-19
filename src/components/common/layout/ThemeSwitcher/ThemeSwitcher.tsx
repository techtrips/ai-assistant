import { Dropdown, Option } from "@fluentui/react-components";
import { useTheme, Theme } from "../../../resources/styles";
import { useStyles } from "./ThemeSwitcher.styles";

const themeOptions = [
	{ key: Theme.WebLight, text: "Web Light" },
	{ key: Theme.WebDark, text: "Web Dark" },
	{ key: Theme.TeamsLight, text: "Teams Light" },
	{ key: Theme.TeamsDark, text: "Teams Dark" },
	{ key: Theme.TeamsHighContrast, text: "Teams High Contrast" },
];

export const ThemeSwitcher = () => {
	const classes = useStyles();
	const { currentTheme, setTheme } = useTheme();

	const handleThemeChange = (
		_event: unknown,
		data: { optionValue?: string },
	) => {
		if (data.optionValue) {
			setTheme(data.optionValue as Theme);
		}
	};

	const selectedOption = themeOptions.find((opt) => opt.key === currentTheme);

	return (
		<div className={classes.container}>
			<label className={classes.label}>Theme:</label>
			<Dropdown
				className={classes.dropdown}
				value={selectedOption?.text}
				selectedOptions={[currentTheme]}
				onOptionSelect={handleThemeChange}
			>
				{themeOptions.map((option) => (
					<Option key={option.key} value={option.key}>
						{option.text}
					</Option>
				))}
			</Dropdown>
		</div>
	);
};
