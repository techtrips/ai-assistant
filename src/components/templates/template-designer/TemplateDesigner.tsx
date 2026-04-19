import { useCallback, useRef, useState } from "react";
import {
	ITemplateDesignerProps,
	TemplateDesignerMode,
} from "./TemplateDesigner.models";
import { useInit } from "./TemplateDesigner.hooks";
import { useTemplateDesignerStyles } from "./TemplateDesigner.styles";
import {
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogSurface,
	DialogTitle,
	DialogTrigger,
	Text,
	ToggleButton,
	Tooltip,
} from "@fluentui/react-components";
import {
	EditRegular,
	EyeRegular,
	CodeRegular,
	SaveRegular,
	DismissRegular,
	DesignIdeasRegular,
	PanelRightRegular,
	ChevronLeftRegular,
	ArrowUploadRegular,
	CheckmarkCircleRegular,
	ArrowUndoRegular,
	CopyRegular,
	CheckmarkRegular,
} from "@fluentui/react-icons";
import { TemplateRenderer } from "../template-renderer/TemplateRenderer";
import { TemplateTreeView } from "./template-treeview/TemplateTreeView";
import { PropertyPanel } from "./property-panel/PropertyPanel";
import type { ITemplate } from "../templates.models";
import type { ISelectedElement } from "./TemplateDesigner.models";
import {
	extractBindingPaths,
	validateTemplateJson,
} from "./TemplateDesigner.utils";
import { IActionArgs } from "../../ai-assistant-old/AIAssistant.models";

const MODE_OPTIONS: {
	key: TemplateDesignerMode;
	label: string;
	icon: React.ReactElement;
}[] = [
	{ key: TemplateDesignerMode.Design, label: "Design", icon: <EditRegular /> },
	{ key: TemplateDesignerMode.Preview, label: "Preview", icon: <EyeRegular /> },
	{ key: TemplateDesignerMode.JSON, label: "JSON", icon: <CodeRegular /> },
];

const getSelectedBadge = (
	selected: ISelectedElement | undefined,
	template: ITemplate | undefined,
): string | null => {
	if (!selected) return null;
	if (selected.type === "card") return "Card";
	if (selected.type === "section") return "Section";
	if (selected.type === "control" && template) {
		const findCtrl = (
			sections: ITemplate["card"]["sections"],
		): string | null => {
			for (const s of sections ?? []) {
				const c = s.children?.find((ch) => ch.id === selected.id);
				if (c) return c.type.charAt(0).toUpperCase() + c.type.slice(1);
				const sub = findCtrl(s.subsections);
				if (sub) return sub;
			}
			return null;
		};
		const cardChild = template.card.children?.find((c) => c.id === selected.id);
		if (cardChild)
			return cardChild.type.charAt(0).toUpperCase() + cardChild.type.slice(1);
		return findCtrl(template.card.sections);
	}
	return null;
};

const onAction = (action: string, payload: IActionArgs) => {
	console.log("Action triggered:", action, payload);
};

export const TemplateDesigner = (props: ITemplateDesignerProps) => {
	const classes = useTemplateDesignerStyles();
	const { state, actions } = useInit(props);
	const isReadOnly = props.isReadOnly ?? false;
	const [showProperties, setShowProperties] = useState(true);
	const [jsonUploadError, setJsonUploadError] = useState<string | null>(null);
	const [showBindingPreview, setShowBindingPreview] = useState(false);
	const [jsonCopied, setJsonCopied] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const templateJsonInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const json: unknown = JSON.parse(reader.result as string);
					const paths = extractBindingPaths(json);
					actions.setBindingPaths(paths);
					actions.setBindingData(json as Record<string, unknown>);
				} catch {
					// invalid JSON — ignore
				}
			};
			reader.readAsText(file);
			// Reset so the same file can be re-uploaded
			e.target.value = "";
		},
		[actions],
	);

	const handleTemplateJsonFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const parsed: unknown = JSON.parse(reader.result as string);
					const error = validateTemplateJson(parsed);
					if (error) {
						setJsonUploadError(error);
					} else {
						setJsonUploadError(null);
						actions.updateTemplate(parsed as ITemplate);
					}
				} catch {
					setJsonUploadError("Invalid JSON: file could not be parsed.");
				}
			};
			reader.readAsText(file);
			e.target.value = "";
		},
		[actions],
	);

	const handleCopyJson = useCallback((t: ITemplate) => {
		const json = JSON.stringify(t, null, 2);
		navigator.clipboard.writeText(json).then(() => {
			setJsonCopied(true);
			setTimeout(() => setJsonCopied(false), 2000);
		});
	}, []);

	if (state.template.loading) {
		return (
			<div className={classes.emptyState}>
				<Text>Loading template...</Text>
			</div>
		);
	}

	if (state.template.error) {
		return (
			<div className={classes.emptyState}>
				<Text weight="semibold">Unable to load template</Text>
				<Text size={200}>{state.template.error}</Text>
			</div>
		);
	}

	const template = state.template.data;
	const selectedBadge = getSelectedBadge(state.selectedElement, template);

	const renderToolbar = () => (
		<div className={classes.toolbar}>
			<div className={classes.toolbarTitle}>
				<DesignIdeasRegular fontSize={20} />
				<Text weight="semibold" size={400}>
					{template?.name ?? "Template Designer"}
				</Text>
				{state.isDirty && (
					<Text size={200} italic style={{ opacity: 0.6 }}>
						(unsaved changes)
					</Text>
				)}
			</div>
			<div className={classes.toolbarActions}>
				{!isReadOnly && (
					<>
						<div className={classes.modeGroup}>
							{MODE_OPTIONS.map(({ key, label, icon }) => (
								<Tooltip key={key} content={label} relationship="label">
									<ToggleButton
										appearance="subtle"
										size="small"
										icon={icon}
										checked={state.mode === key}
										onClick={() => actions.setMode(key)}
									>
										{label}
									</ToggleButton>
								</Tooltip>
							))}
						</div>
					</>
				)}
				{!isReadOnly && (
					<>
						<div className={classes.dividerVertical} />
						{state.bindingPaths.length > 0 ? (
							<div className={classes.bindingGroup}>
								<Tooltip
									content={`Data source loaded (${state.bindingPaths.length} paths)`}
									relationship="label"
								>
									<Button
										appearance="subtle"
										size="small"
										icon={
											<CheckmarkCircleRegular
												className={classes.bindingLoadedIcon}
											/>
										}
										className={classes.bindingLoadedBtn}
										onClick={() => setShowBindingPreview(true)}
									>
										Data Source ({state.bindingPaths.length})
									</Button>
								</Tooltip>
								<div className={classes.bindingGroupDivider} />
								<Tooltip content="Re-upload data source" relationship="label">
									<Button
										appearance="subtle"
										size="small"
										icon={<ArrowUploadRegular />}
										className={classes.bindingReuploadBtn}
										onClick={() => fileInputRef.current?.click()}
									/>
								</Tooltip>
							</div>
						) : (
							<Tooltip content="Upload data source JSON" relationship="label">
								<Button
									appearance="subtle"
									size="small"
									icon={<ArrowUploadRegular />}
									onClick={() => fileInputRef.current?.click()}
								>
									Data Source
								</Button>
							</Tooltip>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							className={classes.hiddenInput}
							aria-label="Upload data source JSON file"
							onChange={handleFileChange}
						/>
						<Tooltip content="Revert to last saved" relationship="label">
							<Button
								appearance="subtle"
								size="small"
								icon={<ArrowUndoRegular />}
								onClick={actions.revert}
								disabled={!state.isDirty}
							>
								Revert
							</Button>
						</Tooltip>
						<Tooltip content="Save template" relationship="label">
							<Button
								appearance="primary"
								size="small"
								icon={<SaveRegular />}
								onClick={actions.save}
								disabled={!state.isDirty}
							>
								Save
							</Button>
						</Tooltip>
						{props.onClose && (
							<Tooltip content="Close designer" relationship="label">
								<Button
									appearance="subtle"
									size="small"
									icon={<DismissRegular />}
									onClick={props.onClose}
								>
									Close
								</Button>
							</Tooltip>
						)}
					</>
				)}
			</div>
		</div>
	);

	const renderPropertyPanel = () =>
		showProperties && state.selectedElement ? (
			<div className={classes.propertyPanel}>
				<div className={classes.propertyPanelHeader}>
					<div className={classes.propertyPanelHeaderLeft}>
						<Text
							weight="semibold"
							size={200}
							className={classes.propertyPanelHeaderLabel}
						>
							Properties
						</Text>
						{selectedBadge && (
							<span className={classes.propertyPanelHeaderBadge}>
								{selectedBadge}
							</span>
						)}
					</div>
					<Tooltip content="Hide properties" relationship="label">
						<Button
							appearance="subtle"
							size="small"
							icon={
								<ChevronLeftRegular style={{ transform: "rotate(180deg)" }} />
							}
							onClick={() => setShowProperties(false)}
						/>
					</Tooltip>
				</div>
				<div className={classes.propertyPanelBody}>
					<PropertyPanel
						template={template!}
						selectedElement={state.selectedElement}
						onTemplateChange={actions.updateTemplate}
						onSelectElement={actions.selectElement}
						bindingPaths={state.bindingPaths}
						bindingData={state.bindingData}
					/>
				</div>
			</div>
		) : (
			<div
				className={classes.propertyPanelCollapsed}
				onClick={() => setShowProperties(true)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter") setShowProperties(true);
				}}
			>
				<PanelRightRegular fontSize={16} />
				<Text size={200} weight="semibold" className={classes.collapsedLabel}>
					Properties
				</Text>
			</div>
		);

	const renderDesignMode = (t: ITemplate) => (
		<div className={classes.editorLayout}>
			<div className={classes.treePanel}>
				<TemplateTreeView
					template={t}
					selectedElement={state.selectedElement}
					onSelectElement={actions.selectElement}
					onAddSection={actions.addSection}
					onRemoveSection={actions.removeSection}
					onAddControl={actions.addControl}
					onRemoveControl={actions.removeControl}
					onAddControlToCard={actions.addControlToCard}
					onRemoveControlFromCard={actions.removeControlFromCard}
					onMoveNode={actions.moveNode}
				/>
			</div>
			<div className={classes.previewPanel}>
				<div className={classes.previewPanelHeader}>
					<Text
						weight="semibold"
						size={200}
						className={classes.previewPanelHeaderLabel}
					>
						Preview
					</Text>
				</div>
				<div className={classes.previewPanelBody}>
					<div className={classes.previewCard}>
						<TemplateRenderer
							data={{ template: t, serverData: state.bindingData }}
							onAction={onAction}
						/>
					</div>
				</div>
			</div>
			{renderPropertyPanel()}
		</div>
	);

	const renderPreviewMode = (t: ITemplate) => (
		<div className={classes.fullPreview}>
			<div className={classes.fullPreviewCard}>
				<TemplateRenderer
					data={{ template: t, serverData: state.bindingData }}
					onAction={onAction}
				/>
			</div>
		</div>
	);

	const renderJsonMode = (t: ITemplate) => (
		<div className={classes.jsonView}>
			<div className={classes.jsonContainer}>
				<div className={classes.jsonToolbar}>
					<Tooltip content="Upload template JSON" relationship="label">
						<Button
							appearance="outline"
							size="small"
							icon={<ArrowUploadRegular />}
							onClick={() => templateJsonInputRef.current?.click()}
						>
							Import Template JSON
						</Button>
					</Tooltip>
					<Tooltip content="Copy JSON to clipboard" relationship="label">
						<Button
							appearance="outline"
							size="small"
							icon={jsonCopied ? <CheckmarkRegular /> : <CopyRegular />}
							onClick={() => handleCopyJson(t)}
						>
							{jsonCopied ? "Copied!" : "Copy JSON"}
						</Button>
					</Tooltip>
					<input
						ref={templateJsonInputRef}
						type="file"
						accept=".json"
						className={classes.hiddenInput}
						aria-label="Upload template JSON file"
						onChange={handleTemplateJsonFileChange}
					/>
				</div>
				{jsonUploadError && (
					<div className={classes.jsonError}>
						<Text size={200} weight="semibold">
							Import failed:
						</Text>
						<Text size={200}>{jsonUploadError}</Text>
					</div>
				)}
				<pre className={classes.jsonPre}>{JSON.stringify(t, null, 2)}</pre>
			</div>
		</div>
	);

	const renderBindingPreviewDialog = () => (
		<Dialog
			open={showBindingPreview}
			onOpenChange={(_e, data) => setShowBindingPreview(data.open)}
		>
			<DialogSurface className={classes.bindingDialogSurface}>
				<DialogBody>
					<DialogTitle
						action={
							<DialogTrigger action="close">
								<Button
									appearance="subtle"
									size="small"
									icon={<DismissRegular />}
									aria-label="Close"
								/>
							</DialogTrigger>
						}
					>
						Data Source ({state.bindingPaths.length} paths)
					</DialogTitle>
					<DialogContent>
						<pre className={classes.bindingPreviewPre}>
							{JSON.stringify(state.bindingData, null, 2)}
						</pre>
					</DialogContent>
				</DialogBody>
			</DialogSurface>
		</Dialog>
	);

	return (
		<div className={classes.root}>
			{renderToolbar()}
			<div className={classes.content}>
				{!isReadOnly &&
					state.mode === TemplateDesignerMode.Design &&
					template &&
					renderDesignMode(template)}
				{state.mode === TemplateDesignerMode.Preview &&
					template &&
					renderPreviewMode(template)}
				{!isReadOnly &&
					state.mode === TemplateDesignerMode.JSON &&
					template &&
					renderJsonMode(template)}
			</div>
			{renderBindingPreviewDialog()}
		</div>
	);
};
