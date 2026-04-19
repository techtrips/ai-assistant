import type { ReactNode } from "react";

export interface ISlidePanelButtons {
	submitLabel?: string;
	cancelLabel?: string;
	submitDisabled?: boolean;
	onSubmit?: () => void;
	onCancel?: () => void;
}

export interface ISlidePanelProps {
	title: string;
	icon?: ReactNode;
	children: ReactNode;
	buttons?: ISlidePanelButtons;
	disabled?: boolean;
	error?: string;
	onClose?: () => void;
}
