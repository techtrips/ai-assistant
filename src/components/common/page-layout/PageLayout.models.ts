import type React from "react";

export interface IPageLayoutProps {
	/** Page title displayed in the header */
	title: string;
	/** Whether to use compact sidebar styling */
	isSidebar?: boolean;
	/** Action buttons rendered in the header (right side, before close button) */
	headerActions?: React.ReactNode;
	/** Optional toolbar rendered between header and content */
	toolbar?: React.ReactNode;
	/** Page content */
	children: React.ReactNode;
	/** Called when the sidebar close button is clicked (only shown in sidebar mode) */
	onClose?: () => void;
}
