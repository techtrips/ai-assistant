import { DismissRegular } from "@fluentui/react-icons";
import type { ReactNode } from "react";
import { usePageLayoutStyles } from "./PageLayout.styles";

interface PageLayoutProps {
	title: string;
	headerActions?: ReactNode;
	toolbar?: ReactNode;
	children: ReactNode;
	onClose?: () => void;
}

export const PageLayout = ({
	title,
	headerActions,
	toolbar,
	children,
	onClose,
}: PageLayoutProps) => {
	const classes = usePageLayoutStyles();

	return (
		<div className={classes.root}>
			<div className={classes.header}>
				<div className={classes.titleGroup}>
					<div className={classes.title}>{title}</div>
				</div>
				<div className={classes.actions}>
					{headerActions}
					{onClose && (
						<button
							className={classes.closeButton}
							type="button"
							title={`Close ${title.toLowerCase()}`}
							aria-label={`Close ${title.toLowerCase()}`}
							onClick={onClose}
						>
							<DismissRegular fontSize={18} />
						</button>
					)}
				</div>
			</div>
			{toolbar && <div className={classes.toolbar}>{toolbar}</div>}
			<div className={classes.content}>{children}</div>
		</div>
	);
};
