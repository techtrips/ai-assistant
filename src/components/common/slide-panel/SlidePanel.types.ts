import type React from "react";

export interface ISlidePanelFooterButtonProps {
	/** Label for the primary (submit) button */
	submitLabel?: string;
	/** Label for the secondary (cancel) button */
	cancelLabel?: string;
	/** Whether the submit button is disabled */
	submitDisabled?: boolean;
	/** Called when the primary button is clicked */
	onSubmit?: () => void;
	/** Called when the cancel button is clicked */
	onCancel?: () => void;
}

export interface ISlidePanelProps {
	/** Title text displayed in the panel header */
	title: string;
	/** Optional icon rendered before the title */
	icon?: React.ReactNode;
	/** Panel body content */
	children: React.ReactNode;
	/** Footer button configuration; footer is hidden when omitted */
	buttons?: ISlidePanelFooterButtonProps;
	/** Whether the panel is disabled (e.g. during save) */
	disabled?: boolean;
	/** Use compact sidebar styling */
	isSidebar?: boolean;
	/** Error message displayed above the body content */
	error?: string;
	/** Custom panel width (CSS value, e.g. '600px' or '90%') */
	width?: string;
	/** Called when the panel should close (close button, backdrop click) */
	onClose?: () => void;
}
