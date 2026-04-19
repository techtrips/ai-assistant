import { Switch, mergeClasses } from "@fluentui/react-components";
import { useMemo } from "react";
import { useSettingsPageStyles } from "./SettingsPage.styles";
import { PageLayout } from "../../../common/page-layout";
import { AIAssistantFeature, hasFeature } from "../../AIAssistant.models";

interface ISettingsPageProps {
	isSidebar?: boolean;
	isDeveloperMode: boolean;
	useRawResponse: boolean;
	onClose?: () => void;
	onToggleDeveloperMode: () => void;
	onToggleRawResponse: () => void;
	features?: AIAssistantFeature[];
}

export const SettingsPage = (props: ISettingsPageProps) => {
	const {
		isDeveloperMode,
		isSidebar = false,
		onClose,
		onToggleDeveloperMode,
		useRawResponse,
		onToggleRawResponse,
		features,
	} = props;
	const classes = useSettingsPageStyles();

	const mergedStyles = useMemo(() => {
		const merge = (key: keyof typeof classes) =>
			mergeClasses(
				classes[key],
				isSidebar && classes[`${key}Sidebar` as keyof typeof classes],
			);

		return {
			description: merge("description"),
			body: merge("body"),
			section: merge("section"),
			settingRow: merge("settingRow"),
			settingLabel: merge("settingLabel"),
			settingDescription: merge("settingDescription"),
		};
	}, [classes, isSidebar]);

	return (
		<PageLayout title="Settings" isSidebar={isSidebar} onClose={onClose}>
			<div className={mergedStyles.body}>
				<p className={mergedStyles.description}>
					Controls in this area affect the assistant workspace rather than a
					single conversation.
				</p>

				<section className={mergedStyles.section}>
					{hasFeature(features, AIAssistantFeature.DeveloperTools) && (
						<>
							<div className={mergedStyles.settingRow}>
								<div className={classes.settingCopy}>
									<span className={mergedStyles.settingLabel}>
										Agent activity
									</span>
									<span className={mergedStyles.settingDescription}>
										Show agent background activities while responding to user
										prompts
									</span>
								</div>
								<Switch
									checked={isDeveloperMode}
									label={isDeveloperMode ? "On" : "Off"}
									labelPosition="before"
									size={isSidebar ? "small" : "medium"}
									onChange={onToggleDeveloperMode}
								/>
							</div>

							<hr className={classes.settingDivider} />
							<div className={mergedStyles.settingRow}>
								<div className={classes.settingCopy}>
									<span className={mergedStyles.settingLabel}>
										Raw response
									</span>
									<span className={mergedStyles.settingDescription}>
										Skip template resolution and show the raw assistant response
									</span>
								</div>
								<Switch
									checked={useRawResponse}
									label={useRawResponse ? "On" : "Off"}
									labelPosition="before"
									size={isSidebar ? "small" : "medium"}
									onChange={onToggleRawResponse}
								/>
							</div>
						</>
					)}
				</section>
			</div>
		</PageLayout>
	);
};
