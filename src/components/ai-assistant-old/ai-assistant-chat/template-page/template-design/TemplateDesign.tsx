import { useCallback, useState } from "react";
import { Skeleton, SkeletonItem } from "@fluentui/react-components";
import { PaintBrush24Regular } from "@fluentui/react-icons";
import { TemplateDesigner } from "../../../../templates/template-designer/TemplateDesigner";
import type { ITemplate } from "../../../../templates/templates.models";
import { SlidePanel } from "../../../../common/slide-panel";
import type { ITemplateDesignProps } from "./TemplateDesign.models";
import { useTemplateDesignStyles } from "./TemplateDesign.styles";

export const TemplateDesign = (props: ITemplateDesignProps) => {
	const {
		template,
		isLoading,
		isReadOnly,
		error: loadError,
		onClose,
		onSave,
	} = props;
	const classes = useTemplateDesignStyles();

	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState("");
	const error = loadError || saveError;

	const parsedTemplate = (() => {
		try {
			return JSON.parse(template?.content ?? "{}") as ITemplate;
		} catch {
			return undefined;
		}
	})();

	const parsedDataSource = (() => {
		try {
			return JSON.parse(template?.data ?? "{}") as
				| Record<string, unknown>
				| string;
		} catch {
			return undefined;
		}
	})();

	const handleSave = useCallback(
		async (
			t: ITemplate,
			templateDataSource?: Record<string, unknown> | string,
		) => {
			setIsSaving(true);
			try {
				await onSave({
					...template,
					content: JSON.stringify(t),
					data: JSON.stringify(templateDataSource),
				});
			} catch {
				setSaveError("Failed to save template config.");
			} finally {
				setIsSaving(false);
			}
		},
		[template, onSave],
	);

	/* ── Render helpers ──────────────────────────────────────────────── */

	const renderLoadingSkeleton = () => (
		<Skeleton
			className={classes.shimmerRoot}
			animation="pulse"
			aria-label="Loading template config"
		>
			{/* Toolbar */}
			<div className={classes.shimmerToolbar}>
				<div className={classes.shimmerToolbarLeft}>
					<SkeletonItem size={20} style={{ width: 20, borderRadius: 4 }} />
					<SkeletonItem size={16} style={{ width: 120 }} />
				</div>
				<div className={classes.shimmerToolbarRight}>
					<SkeletonItem size={28} style={{ width: 160, borderRadius: 6 }} />
					<SkeletonItem size={28} style={{ width: 80, borderRadius: 6 }} />
				</div>
			</div>

			{/* 3-column content */}
			<div className={classes.shimmerContent}>
				{/* Tree panel */}
				<div className={classes.shimmerTreePanel}>
					<SkeletonItem size={12} style={{ width: "60%" }} />
					<SkeletonItem size={12} style={{ width: "80%", marginLeft: 12 }} />
					<SkeletonItem size={12} style={{ width: "55%", marginLeft: 12 }} />
					<SkeletonItem size={12} style={{ width: "70%", marginLeft: 24 }} />
					<SkeletonItem size={12} style={{ width: "50%", marginLeft: 24 }} />
					<SkeletonItem size={12} style={{ width: "65%" }} />
					<SkeletonItem size={12} style={{ width: "45%", marginLeft: 12 }} />
				</div>

				{/* Preview panel */}
				<div className={classes.shimmerPreviewPanel}>
					<SkeletonItem size={12} style={{ width: 80 }} />
					<div className={classes.shimmerPreviewCard}>
						<SkeletonItem size={16} style={{ width: "50%" }} />
						<SkeletonItem size={12} style={{ width: "100%" }} />
						<SkeletonItem size={12} style={{ width: "85%" }} />
						<SkeletonItem size={12} style={{ width: "60%" }} />
						<SkeletonItem
							size={48}
							style={{ width: "100%", borderRadius: 8 }}
						/>
						<SkeletonItem size={12} style={{ width: "75%" }} />
					</div>
				</div>

				{/* Property panel */}
				<div className={classes.shimmerPropertyPanel}>
					<SkeletonItem size={12} style={{ width: 80 }} />
					<SkeletonItem size={24} style={{ width: "100%", borderRadius: 4 }} />
					<SkeletonItem size={12} style={{ width: 60 }} />
					<SkeletonItem size={24} style={{ width: "100%", borderRadius: 4 }} />
					<SkeletonItem size={12} style={{ width: 70 }} />
					<SkeletonItem size={24} style={{ width: "100%", borderRadius: 4 }} />
				</div>
			</div>
		</Skeleton>
	);

	const renderDesigner = () => (
		<>
			{isSaving && <div className={classes.panelBusyOverlay} />}
			<TemplateDesigner
				template={parsedTemplate}
				dataSource={parsedDataSource}
				isReadOnly={isReadOnly}
				onSave={handleSave}
			/>
		</>
	);

	/* ── Render ──────────────────────────────────────────────────────── */

	return (
		<SlidePanel
			title="Template Designer"
			icon={<PaintBrush24Regular />}
			width="100%"
			error={error}
			onClose={onClose}
		>
			{isLoading ? renderLoadingSkeleton() : renderDesigner()}
		</SlidePanel>
	);
};
