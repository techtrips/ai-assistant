import { DismissRegular } from "@fluentui/react-icons";
import { useSlidePanelStyles } from "./SlidePanel.styles";
import type { ISlidePanelProps } from "./SlidePanel.types";

export const SlidePanel = ({
	title,
	icon,
	children,
	buttons,
	disabled = false,
	error,
	onClose,
}: ISlidePanelProps) => {
	const classes = useSlidePanelStyles();
	const {
		submitLabel = "Submit",
		cancelLabel = "Cancel",
		submitDisabled = false,
		onSubmit,
		onCancel,
	} = buttons ?? {};

	return (
		<div className={classes.layer}>
			<div className={classes.backdrop} onClick={onClose} />
			<section
				className={classes.panel}
				role="dialog"
				aria-labelledby="slide-panel-title"
				aria-modal="true"
			>
				<div className={classes.header}>
					<div className={classes.titleRow}>
						{icon && <span className={classes.titleIcon}>{icon}</span>}
						<span className={classes.title} id="slide-panel-title">
							{title}
						</span>
					</div>
					{onClose && (
						<button
							className={classes.closeButton}
							type="button"
							aria-label="Close panel"
							disabled={disabled}
							onClick={onClose}
						>
							<DismissRegular fontSize={16} />
						</button>
					)}
				</div>

				<div className={classes.body}>
					{error && <div className={classes.errorBanner}>{error}</div>}
					{children}
				</div>

				{buttons && (onSubmit || onCancel) && (
					<div className={classes.footer}>
						{onSubmit && (
							<button
								className={classes.primaryButton}
								type="button"
								disabled={submitDisabled || disabled}
								onClick={onSubmit}
							>
								{submitLabel}
							</button>
						)}
						{onCancel && (
							<button
								className={classes.secondaryButton}
								type="button"
								disabled={disabled}
								onClick={onCancel}
							>
								{cancelLabel}
							</button>
						)}
					</div>
				)}
			</section>
		</div>
	);
};
