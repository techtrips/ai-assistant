import { useMemo } from "react";
import { Button, mergeClasses } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import type { ISlidePanelProps } from "./SlidePanel.types";
import { useSlidePanelStyles } from "./SlidePanel.styles";

export const SlidePanel = (props: ISlidePanelProps) => {
	const {
		title,
		icon,
		children,
		buttons,
		disabled = false,
		isSidebar = false,
		error,
		width,
		onClose,
	} = props;

	const {
		submitLabel = "Submit",
		cancelLabel = "Cancel",
		submitDisabled = false,
		onSubmit,
		onCancel,
	} = buttons ?? {};

	const classes = useSlidePanelStyles();
	const buttonSize = isSidebar ? ("small" as const) : ("medium" as const);

	const styles = useMemo(() => {
		const merge = (key: keyof typeof classes) =>
			mergeClasses(
				classes[key],
				isSidebar && classes[`${key}Sidebar` as keyof typeof classes],
			);

		return {
			panel: merge("panel"),
			header: merge("header"),
			titleIcon: merge("titleIcon"),
			title: merge("title"),
			body: merge("body"),
			footer: merge("footer"),
			primaryButton: merge("primaryButton"),
			secondaryButton: merge("secondaryButton"),
		};
	}, [classes, isSidebar]);

	return (
		<div className={classes.layer}>
			<div className={classes.backdrop} onClick={onClose} />
			<section
				className={styles.panel}
				style={width ? { width } : undefined}
				role="dialog"
				aria-labelledby="slide-panel-title"
				aria-modal="true"
			>
				<div className={styles.header}>
					<div className={classes.titleGroup}>
						<div className={classes.titleRow}>
							{icon && <span className={styles.titleIcon}>{icon}</span>}
							<span className={styles.title} id="slide-panel-title">
								{title}
							</span>
						</div>
					</div>
					{onClose && (
						<Button
							appearance="subtle"
							className={classes.closeButton}
							icon={<DismissRegular />}
							aria-label="Close panel"
							disabled={disabled}
							onClick={onClose}
						/>
					)}
				</div>

				<div className={styles.body}>
					{error && <div className={classes.errorBanner}>{error}</div>}
					{children}
				</div>

				{buttons && (onSubmit || onCancel) && (
					<div className={styles.footer}>
						{onSubmit && (
							<Button
								appearance="primary"
								size={buttonSize}
								className={styles.primaryButton}
								disabled={submitDisabled || disabled}
								onClick={onSubmit}
							>
								{submitLabel}
							</Button>
						)}
						{onCancel && (
							<Button
								appearance="secondary"
								size={buttonSize}
								className={styles.secondaryButton}
								disabled={disabled}
								onClick={onCancel}
							>
								{cancelLabel}
							</Button>
						)}
					</div>
				)}
			</section>
		</div>
	);
};
