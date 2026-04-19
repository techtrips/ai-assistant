import {
	Tree,
	TreeItem,
	TreeItemLayout,
	Button,
	Text,
	Tooltip,
	Menu,
	MenuTrigger,
	MenuPopover,
	MenuList,
	MenuItem,
	MenuDivider,
	mergeClasses,
} from "@fluentui/react-components";
import {
	DeleteRegular,
	DocumentRegular,
	GridRegular,
	TextFieldRegular,
	TableRegular,
	ImageRegular,
	ButtonRegular,
	BadgeRegular,
	SlideLayoutRegular,
	AddRegular,
	FormNewRegular,
	LineHorizontal1Regular,
} from "@fluentui/react-icons";
import type { ISectionControl, ITemplateControl } from "../../templates.models";
import { ControlType, getOrderedItems } from "../../templates.models";
import type { ITemplateTreeViewProps } from "./TemplateTreeView.models";
import { CONTROL_LABELS } from "./TemplateTreeView.models";
import { useTemplateTreeViewStyles } from "./TemplateTreeView.styles";
import {
	useTreeDragDrop,
	useTreeOpenState,
	useTreeSelection,
} from "./TemplateTreeView.hooks";

const CONTROL_ICONS: Record<ControlType, React.ReactElement> = {
	[ControlType.Field]: <TextFieldRegular />,
	[ControlType.Button]: <ButtonRegular />,
	[ControlType.Table]: <TableRegular />,
	[ControlType.Badge]: <BadgeRegular />,
	[ControlType.Image]: <ImageRegular />,
	[ControlType.ProgressBar]: <SlideLayoutRegular />,
	[ControlType.InputField]: <FormNewRegular />,
	[ControlType.Separator]: <LineHorizontal1Regular />,
};

export const TemplateTreeView = (props: ITemplateTreeViewProps) => {
	const {
		template,
		selectedElement,
		onSelectElement,
		onAddSection,
		onRemoveSection,
		onAddControl,
		onRemoveControl,
		onAddControlToCard,
		onRemoveControlFromCard,
		onMoveNode,
	} = props;
	const classes = useTemplateTreeViewStyles();

	const {
		draggingId,
		handleDragStart,
		handleDragEnd,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		getDropClass,
	} = useTreeDragDrop(template.card.sections ?? [], onMoveNode, classes);

	const { openItemsArray, handleOpenChange } = useTreeOpenState(
		selectedElement,
		template.card.sections ?? [],
		template.card.children,
	);

	const { isSelected, treeContainerRef } = useTreeSelection(
		selectedElement,
		onSelectElement,
	);

	const renderAddMenu = (
		tooltip: string,
		onAddSectionClick: () => void,
		onAddControlClick: (ct: ControlType) => void,
	) => (
		<Menu>
			<MenuTrigger disableButtonEnhancement>
				<Tooltip content={tooltip} relationship="label">
					<Button appearance="subtle" size="small" icon={<AddRegular />} />
				</Tooltip>
			</MenuTrigger>
			<MenuPopover>
				<MenuList>
					<MenuItem icon={<GridRegular />} onClick={onAddSectionClick}>
						Section
					</MenuItem>
					<MenuDivider />
					{Object.values(ControlType).map((ct) => (
						<MenuItem
							key={ct}
							icon={CONTROL_ICONS[ct]}
							onClick={() => onAddControlClick(ct)}
						>
							{CONTROL_LABELS[ct]}
						</MenuItem>
					))}
				</MenuList>
			</MenuPopover>
		</Menu>
	);

	const renderControl = (
		control: ITemplateControl,
		parentId: string,
		indexInParent: number,
		onRemove: (controlId: string) => void,
	) => {
		return (
			<TreeItem
				key={control.id}
				value={`control-${control.id}`}
				itemType="leaf"
				data-select-type="control"
				data-select-id={control.id}
			>
				<TreeItemLayout
					draggable
					onDragStart={(e: React.DragEvent) => {
						e.stopPropagation();
						handleDragStart(e, {
							type: "control",
							id: control.id,
							parentId,
						});
					}}
					onDragEnd={handleDragEnd}
					className={mergeClasses(
						isSelected("control", control.id)
							? classes.selectedItem
							: undefined,
						getDropClass(control.id),
						draggingId === control.id ? classes.dragging : undefined,
					)}
					onDragOver={(e: React.DragEvent) => {
						e.preventDefault();
						e.stopPropagation();
						handleDragOver(e, control.id, "control");
					}}
					onDragLeave={(e: React.DragEvent) => {
						e.stopPropagation();
						handleDragLeave();
					}}
					onDrop={(e: React.DragEvent) => {
						e.preventDefault();
						e.stopPropagation();
						handleDrop(e, "control", control.id, parentId, indexInParent);
					}}
					iconBefore={CONTROL_ICONS[control.type]}
					aside={
						<div data-aside>
							<Tooltip content="Remove control" relationship="label">
								<Button
									className={classes.deleteButton}
									appearance="subtle"
									size="small"
									icon={<DeleteRegular />}
									onClick={(e) => {
										e.stopPropagation();
										onRemove(control.id);
									}}
								/>
							</Tooltip>
						</div>
					}
				>
					{control.type === ControlType.Separator
						? control.label || CONTROL_LABELS[control.type]
						: (control.label ??
							`${CONTROL_LABELS[control.type]} (${control.id.slice(0, 6)})`)}
				</TreeItemLayout>
			</TreeItem>
		);
	};

	const renderSection = (
		section: ISectionControl,
		parentId: string,
		indexInParent: number,
	): React.ReactNode => {
		const label =
			typeof section.label === "string"
				? section.label
				: (section.label?.value ?? section.id);
		return (
			<TreeItem
				key={section.id}
				value={`section-${section.id}`}
				itemType="branch"
				data-select-type="section"
				data-select-id={section.id}
			>
				<TreeItemLayout
					draggable
					onDragStart={(e: React.DragEvent) => {
						e.stopPropagation();
						handleDragStart(e, {
							type: "section",
							id: section.id,
							parentId,
						});
					}}
					onDragEnd={handleDragEnd}
					className={mergeClasses(
						isSelected("section", section.id)
							? classes.selectedItem
							: undefined,
						getDropClass(section.id),
						draggingId === section.id ? classes.dragging : undefined,
					)}
					onDragOver={(e: React.DragEvent) => {
						e.preventDefault();
						e.stopPropagation();
						handleDragOver(e, section.id, "section");
					}}
					onDragLeave={(e: React.DragEvent) => {
						e.stopPropagation();
						handleDragLeave();
					}}
					onDrop={(e: React.DragEvent) => {
						e.preventDefault();
						e.stopPropagation();
						handleDrop(e, "section", section.id, parentId, indexInParent);
					}}
					iconBefore={<GridRegular />}
					aside={
						<div
							data-aside
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
						>
							{renderAddMenu(
								"Add element",
								() => onAddSection(section.id),
								(ct) => onAddControl(section.id, ct),
							)}
							<Tooltip content="Remove section" relationship="label">
								<Button
									className={classes.deleteButton}
									appearance="subtle"
									size="small"
									icon={<DeleteRegular />}
									onClick={() => onRemoveSection(section.id)}
								/>
							</Tooltip>
						</div>
					}
				>
					{label}
				</TreeItemLayout>
				<Tree>
					{getOrderedItems(
						section.children,
						section.subsections,
						section.ordering,
					).map((entry, i) =>
						entry.type === "control"
							? renderControl(entry.item, section.id, i, (controlId) =>
									onRemoveControl(section.id, controlId),
								)
							: renderSection(entry.item, section.id, i),
					)}
				</Tree>
			</TreeItem>
		);
	};

	const renderCardNode = () => (
		<TreeItem
			value="card"
			itemType="branch"
			data-select-type="card"
			data-select-id="card"
		>
			<TreeItemLayout
				className={
					isSelected("card", "card") ? classes.selectedItem : undefined
				}
				iconBefore={<DocumentRegular />}
				aside={
					<div
						data-aside
						onClick={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
					>
						{renderAddMenu(
							"Add element to card",
							() => onAddSection(),
							onAddControlToCard,
						)}
					</div>
				}
			>
				{typeof template.card.title === "string"
					? template.card.title
					: (template.card.title?.value ?? "Card")}
			</TreeItemLayout>
			<Tree>
				{getOrderedItems(
					template.card.children,
					template.card.sections,
					template.card.ordering,
				).map((entry, i) =>
					entry.type === "control"
						? renderControl(entry.item, "card", i, onRemoveControlFromCard)
						: renderSection(entry.item, "card", i),
				)}
			</Tree>
		</TreeItem>
	);

	const renderHeader = () => (
		<div className={classes.header}>
			<Text weight="semibold" size={200} className={classes.headerLabel}>
				Structure
			</Text>
		</div>
	);

	return (
		<div className={classes.root}>
			{renderHeader()}
			<div className={classes.treeContainer} ref={treeContainerRef}>
				<Tree
					aria-label="Template structure"
					openItems={openItemsArray}
					onOpenChange={handleOpenChange}
				>
					{renderCardNode()}
				</Tree>
			</div>
		</div>
	);
};
