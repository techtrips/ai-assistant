import { Button, Switch } from "@fluentui/react-components";
import {
	ArrowDownRegular,
	ArrowUpRegular,
	SettingsRegular,
} from "@fluentui/react-icons";
import { defineExtension } from "../types";
import type { IExtensionProps } from "../types";
import { PageLayout } from "../shared/page-layout";
import { Shimmer } from "../../../common/shimmer";
import { DEFAULT_ENABLED_RENDERERS } from "../../AIAssistant.types";
import { MessageRendererType } from "../../messageRenderers";
import { useSettingsStyles } from "./Settings.styles";
import { useSettings } from "./useSettings";

/** Labels for built-in renderer types shown in the settings UI. */
const RENDERER_LABELS: Record<string, { label: string; description: string }> =
	{
		[MessageRendererType.Template]: {
			label: "Template rendering",
			description: "Render via stored templates (fast, deterministic)",
		},
		[MessageRendererType.AdaptiveCard]: {
			label: "Adaptive Card rendering",
			description: "Render structured data as cards (zero LLM cost)",
		},
		[MessageRendererType.DynamicUi]: {
			label: "Dynamic UI generation",
			description: "Generate HTML via LLM (slow, costs tokens)",
		},
		[MessageRendererType.Markdown]: {
			label: "Markdown rendering",
			description: "Render the assistant's prose as safe HTML",
		},
	};

const rendererLabel = (type: string) => RENDERER_LABELS[type]?.label ?? type;
const rendererDescription = (type: string) =>
	RENDERER_LABELS[type]?.description ?? "Custom renderer";

const SettingsPanel = ({ onClose }: IExtensionProps) => {
	const classes = useSettingsStyles();
	const {
		userSettings,
		globalSettings,
		loading,
		saving,
		isAdmin,
		configuredExtensions,
		orderedRendererTypes,
		saveUserSetting,
		setRendererEnabled,
		setExtensionEnabled,
		setRendererOrder,
	} = useSettings();

	if (loading) {
		return (
			<PageLayout title="Settings" onClose={onClose}>
				<Shimmer layout="lines" rows={5} />
			</PageLayout>
		);
	}

	const toggleableExtensions = configuredExtensions.filter(
		(ext) => ext.extensionMeta.key !== "settings",
	);

	const moveRenderer = (type: string, dir: -1 | 1) => {
		const idx = orderedRendererTypes.indexOf(type);
		if (idx < 0) return;
		const nextIdx = idx + dir;
		if (nextIdx < 0 || nextIdx >= orderedRendererTypes.length) return;
		const next = [...orderedRendererTypes];
		[next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
		setRendererOrder(next);
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
								checked={userSettings.showAgentActivity ?? true}
								onChange={(_, data) =>
									saveUserSetting("showAgentActivity", data.checked)
								}
							/>
						</label>
					</div>
				</div>

				{/* Global Settings (admin only) */}
				{isAdmin && (
					<>
						{orderedRendererTypes.length > 0 && (
							<div className={classes.section}>
								<span className={classes.sectionTitle}>Renderers</span>
								<span className={classes.sectionHint}>
									Global setting — changes apply to all users.
								</span>
								<div className={classes.card}>
									{orderedRendererTypes.map((type, idx) => {
										const renderers =
											globalSettings.enabledRenderers ??
											DEFAULT_ENABLED_RENDERERS;
										const checked =
											renderers[type] ??
											DEFAULT_ENABLED_RENDERERS[type] ??
											true;
										return (
											<div key={type} className={classes.settingRow}>
												<span className={classes.settingGroup}>
													<span className={classes.settingLabel}>
														<span className={classes.orderIndex}>
															{idx + 1}.
														</span>{" "}
														{rendererLabel(type)}
													</span>
													<span className={classes.settingDescription}>
														{rendererDescription(type)}
													</span>
												</span>
												<span className={classes.orderActions}>
													<Button
														appearance="subtle"
														size="small"
														icon={<ArrowUpRegular />}
														aria-label={`Move ${rendererLabel(type)} up`}
														disabled={idx === 0}
														onClick={() => moveRenderer(type, -1)}
													/>
													<Button
														appearance="subtle"
														size="small"
														icon={<ArrowDownRegular />}
														aria-label={`Move ${rendererLabel(type)} down`}
														disabled={idx === orderedRendererTypes.length - 1}
														onClick={() => moveRenderer(type, 1)}
													/>
													<Switch
														checked={checked}
														onChange={(_, data) =>
															setRendererEnabled(type, data.checked)
														}
													/>
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{toggleableExtensions.length > 0 && (
							<div className={classes.section}>
								<span className={classes.sectionTitle}>Visible features</span>
								<span className={classes.sectionHint}>
									Global setting — changes apply to all users.
								</span>
								<div className={classes.card}>
									{toggleableExtensions.map((ext) => {
										const key = ext.extensionMeta.key;
										const enabledMap = globalSettings.enabledExtensions ?? {};
										const checked = enabledMap[key] !== false;
										return (
											<label key={key} className={classes.settingRow}>
												<span className={classes.settingLabel}>
													{ext.extensionMeta.label}
												</span>
												<Switch
													checked={checked}
													onChange={(_, data) =>
														setExtensionEnabled(key, data.checked)
													}
												/>
											</label>
										);
									})}
								</div>
							</div>
						)}
					</>
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
