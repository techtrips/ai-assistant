import { useMemo } from "react";
import { mergeClasses } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import type { IPageLayoutProps } from "./PageLayout.models";
import { usePageLayoutStyles } from "./PageLayout.styles";

export const PageLayout = (props: IPageLayoutProps) => {
	const {
		title,
		isSidebar = false,
		headerActions,
		toolbar,
		children,
		onClose,
	} = props;

	const classes = usePageLayoutStyles();

	const styles = useMemo(() => {
		const merge = (key: keyof typeof classes) =>
			mergeClasses(
				classes[key],
				isSidebar && classes[`${key}Sidebar` as keyof typeof classes],
			);

		return {
			root: merge("root"),
			pageContainer: merge("pageContainer"),
			header: merge("header"),
			title: merge("title"),
			toolbar: merge("toolbar"),
		};
	}, [classes, isSidebar]);

	return (
		<div className={styles.root}>
			<div className={styles.pageContainer}>
				<div className={styles.header}>
					<div className={classes.headerTitleGroup}>
						<div className={styles.title}>{title}</div>
					</div>
					<div className={classes.headerActions}>
						{headerActions}
						{isSidebar && onClose && (
							<button
								className={classes.headerCloseButton}
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

				{toolbar && <div className={styles.toolbar}>{toolbar}</div>}

				<div className={classes.content}>{children}</div>
			</div>
		</div>
	);
};
