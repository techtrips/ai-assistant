import { Dropdown, Option, Switch } from "@fluentui/react-components";
import { Dismiss12Regular, SettingsRegular } from "@fluentui/react-icons";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { Shimmer } from "../../../common/shimmer";
import { useSettingsStyles } from "./Settings.styles";
import { useSettings } from "./useSettings";

const SettingsPanel = ({ onClose }: IExtensionProps) => {
	const classes = useSettingsStyles();
	const {
		userSettings,
		globalSettings,
		loading,
		saving,
		isAdmin,
		allAgentNames,
		saveUserSetting,
		saveGlobalSetting,
		setVisibleAgents,
	} = useSettings();

	if (loading) {
		return (
			<PageLayout title="Settings" onClose={onClose}>
				<Shimmer layout="lines" rows={5} />
			</PageLayout>
		);
	}

	const visibleAgents = globalSettings.visibleAgents ?? [];
	// Show all agents checked when no explicit filter is set
	const effectiveSelected =
		visibleAgents.length > 0 ? visibleAgents : allAgentNames;

	const handleAgentToggle = (
		_: unknown,
		data: { selectedOptions: string[] },
	) => {
		const sel = data.selectedOptions;
		// Must keep at least 1 agent
		if (sel.length === 0) return;
		// All selected = store empty (meaning "all")
		setVisibleAgents(sel.length === allAgentNames.length ? [] : sel);
	};

	const handleChipRemove = (name: string) => {
		const next = effectiveSelected.filter((a) => a !== name);
		// Must keep at least 1
		if (next.length === 0) return;
		setVisibleAgents(next);
	};

	return (
		<PageLayout
			title="Settings"
			headerActions={
				saving ? <span className={classes.saving}>saving…</span> : undefined
			}
			onClose={onClose}
		>
			<div className={classes.body}>
				{/* User Preferences */}
				<div className={classes.section}>
					<span className={classes.sectionTitle}>Preferences</span>
					<div className={classes.card}>
						<label className={classes.settingRow}>
							<span className={classes.settingLabel}>Show agent activity</span>
							<Switch
								checked={userSettings.showAgentActivity ?? false}
								onChange={(_, data) =>
									saveUserSetting("showAgentActivity", data.checked)
								}
							/>
						</label>
					</div>
				</div>

				{/* Global Settings (admin only) */}
				{isAdmin && (
					<div className={classes.section}>
						<span className={classes.sectionTitle}>Global</span>
						<div className={classes.card}>
							{/* Visible Agents */}
							<div className={classes.dropdownRow}>
								<span className={classes.settingLabel}>Visible agents</span>
								<Dropdown
									size="small"
									multiselect
									placeholder="All agents"
									selectedOptions={effectiveSelected}
									onOptionSelect={handleAgentToggle}
								>
									{allAgentNames.map((name) => (
										<Option key={name} value={name}>
											{name}
										</Option>
									))}
								</Dropdown>
								{effectiveSelected.length > 0 && (
									<div className={classes.agentChips}>
										{effectiveSelected.map((name) => (
											<span key={name} className={classes.agentChip}>
												{name}
												{effectiveSelected.length > 1 && (
													<button
														type="button"
														className={classes.agentChipRemove}
														aria-label={`Remove ${name}`}
														onClick={() => handleChipRemove(name)}
													>
														<Dismiss12Regular />
													</button>
												)}
											</span>
										))}
									</div>
								)}
							</div>

							<label className={classes.settingRow}>
								<span className={classes.settingLabel}>
									Template resolution
								</span>
								<Switch
									checked={globalSettings.enableTemplateResolution ?? true}
									onChange={(_, data) =>
										saveGlobalSetting("enableTemplateResolution", data.checked)
									}
								/>
							</label>

							<label className={classes.settingRow}>
								<span className={classes.settingLabel}>
									Dynamic UI generation
								</span>
								<Switch
									checked={globalSettings.enableDynamicUi ?? true}
									onChange={(_, data) =>
										saveGlobalSetting("enableDynamicUi", data.checked)
									}
								/>
							</label>
						</div>
					</div>
				)}
			</div>
		</PageLayout>
	);
};

export const Settings = defineExtension(SettingsPanel, {
	key: "settings",
	label: "Settings",
	icon: SettingsRegular,
});
