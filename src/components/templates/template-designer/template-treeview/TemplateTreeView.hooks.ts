import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	TreeOpenChangeData,
	TreeOpenChangeEvent,
} from "@fluentui/react-components";
import type { ISectionControl, ITemplateControl } from "../../templates.models";
import type { IDragItem, IDropTarget } from "../TemplateDesigner.actions";
import type { ISelectedElement } from "../TemplateDesigner.models";

// ── useTreeDragDrop ──────────────────────────────────────────────────

type DropPosition = "before" | "after" | "inside";

interface IDropIndicatorClasses {
	dropIndicatorBefore: string;
	dropIndicatorAfter: string;
	dropIndicatorInside: string;
}

export const useTreeDragDrop = (
	sections: ISectionControl[],
	onMoveNode: (drag: IDragItem, drop: IDropTarget) => void,
	indicatorClasses: IDropIndicatorClasses,
) => {
	const dragItemRef = useRef<IDragItem | null>(null);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dropTarget, setDropTarget] = useState<{
		id: string;
		position: DropPosition;
	} | null>(null);

	const getDropPosition = useCallback(
		(e: React.DragEvent, targetType: "control" | "section"): DropPosition => {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const y = e.clientY - rect.top;
			const ratio = y / rect.height;
			const dragType = dragItemRef.current?.type;

			if (targetType === "section" && dragType === "section") {
				return ratio < 0.5 ? "before" : "after";
			}
			if (targetType === "section") {
				if (ratio < 0.25) return "before";
				if (ratio > 0.75) return "after";
				return "inside";
			}
			return ratio < 0.5 ? "before" : "after";
		},
		[],
	);

	const findSectionById = useCallback(
		(secs: ISectionControl[], id: string): ISectionControl | undefined => {
			for (const s of secs) {
				if (s.id === id) return s;
				if (s.subsections) {
					const found = findSectionById(s.subsections, id);
					if (found) return found;
				}
			}
			return undefined;
		},
		[],
	);

	const handleDragStart = useCallback((e: React.DragEvent, item: IDragItem) => {
		dragItemRef.current = item;
		e.dataTransfer.effectAllowed = "move";
		setDraggingId(item.id);
	}, []);

	const handleDragEnd = useCallback(() => {
		dragItemRef.current = null;
		setDraggingId(null);
		setDropTarget(null);
	}, []);

	const handleDragOver = useCallback(
		(
			e: React.DragEvent,
			targetId: string,
			targetType: "control" | "section",
		) => {
			e.dataTransfer.dropEffect = "move";
			const position = getDropPosition(e, targetType);
			setDropTarget((prev) =>
				prev?.id === targetId && prev?.position === position
					? prev
					: { id: targetId, position },
			);
		},
		[getDropPosition],
	);

	const handleDragLeave = useCallback(() => {
		setDropTarget(null);
	}, []);

	const handleDrop = useCallback(
		(
			e: React.DragEvent,
			targetNodeType: "control" | "section",
			targetId: string,
			parentId: string,
			indexInParent: number,
		) => {
			e.preventDefault();
			setDropTarget(null);
			const drag = dragItemRef.current;
			if (!drag) return;
			if (drag.id === targetId) return;
			const position = getDropPosition(e, targetNodeType);

			let dropParentId: string;
			let dropIndex: number;

			if (position === "inside") {
				dropParentId = targetId;
				dropIndex =
					drag.type === "control"
						? (findSectionById(sections, targetId)?.children?.length ?? 0)
						: (findSectionById(sections, targetId)?.subsections?.length ?? 0);
			} else if (position === "before") {
				dropParentId = parentId;
				dropIndex = indexInParent;
			} else {
				dropParentId = parentId;
				dropIndex = indexInParent + 1;
			}

			onMoveNode(drag, { parentId: dropParentId, index: dropIndex });
		},
		[getDropPosition, onMoveNode, sections, findSectionById],
	);

	const getDropClass = useCallback(
		(id: string) => {
			if (!dropTarget || dropTarget.id !== id) return undefined;
			switch (dropTarget.position) {
				case "before":
					return indicatorClasses.dropIndicatorBefore;
				case "after":
					return indicatorClasses.dropIndicatorAfter;
				case "inside":
					return indicatorClasses.dropIndicatorInside;
			}
		},
		[dropTarget, indicatorClasses],
	);

	return {
		draggingId,
		handleDragStart,
		handleDragEnd,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		getDropClass,
	};
};

// ── useTreeOpenState ─────────────────────────────────────────────────

/** Find which section contains a given control id (recursive). */
const findParentSectionId = (
	controlId: string,
	sections: ISectionControl[],
): string | undefined => {
	for (const section of sections) {
		if (section.children?.some((c) => c.id === controlId)) {
			return section.id;
		}
		if (section.subsections) {
			const found = findParentSectionId(controlId, section.subsections);
			if (found) return found;
		}
	}
	return undefined;
};

/**
 * Manages the open/closed state of tree items.
 * Automatically expands parent nodes when the selected element changes.
 */
export const useTreeOpenState = (
	selectedElement: ISelectedElement | undefined,
	sections: ISectionControl[],
	_cardChildren?: ITemplateControl[],
) => {
	const [openItems, setOpenItems] = useState<Set<string>>(
		() => new Set(["card"]),
	);

	// When selected element changes, ensure parents are open
	useEffect(() => {
		if (!selectedElement) return;

		setOpenItems((prev) => {
			const next = new Set(prev);
			next.add("card");

			if (selectedElement.type === "control") {
				const parentId = findParentSectionId(selectedElement.id, sections);
				if (parentId) {
					next.add(`section-${parentId}`);
				}
			} else if (selectedElement.type === "section") {
				const openParentChain = (
					sectionId: string,
					secs: ISectionControl[],
				): boolean => {
					for (const s of secs) {
						if (s.id === sectionId) return true;
						if (s.subsections && openParentChain(sectionId, s.subsections)) {
							next.add(`section-${s.id}`);
							return true;
						}
					}
					return false;
				};
				openParentChain(selectedElement.id, sections);
			}

			if (next.size === prev.size && [...next].every((v) => prev.has(v))) {
				return prev;
			}
			return next;
		});
	}, [selectedElement, sections]);

	const handleOpenChange = useCallback(
		(_e: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
			const next = new Set(data.openItems as Set<string>);
			next.add("card");
			setOpenItems(next);
		},
		[],
	);

	const openItemsArray = useMemo(() => Array.from(openItems), [openItems]);

	return { openItemsArray, handleOpenChange };
};

// ── useTreeSelection ─────────────────────────────────────────────────

/**
 * Manages tree item selection via a native click listener.
 * Uses data-select-type / data-select-id attributes to determine what was clicked.
 */
export const useTreeSelection = (
	selectedElement: ISelectedElement | undefined,
	onSelectElement: (element: ISelectedElement) => void,
) => {
	const isSelected = useCallback(
		(type: ISelectedElement["type"], id: string) =>
			selectedElement?.type === type && selectedElement?.id === id,
		[selectedElement],
	);

	const onSelectRef = useRef(onSelectElement);
	onSelectRef.current = onSelectElement;
	const treeContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = treeContainerRef.current;
		if (!node) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			// Don't select when clicking aside buttons (delete, add menu)
			if (target.closest("[data-aside]")) return;
			// Find the closest element with data-select-type
			const selectEl = target.closest<HTMLElement>("[data-select-type]");
			if (selectEl) {
				const selectType = selectEl.getAttribute("data-select-type");
				const selectId = selectEl.getAttribute("data-select-id");
				if (selectType && selectId) {
					onSelectRef.current({
						type: selectType as ISelectedElement["type"],
						id: selectId,
					});
				}
			}
		};
		node.addEventListener("click", handler, true);
		return () => node.removeEventListener("click", handler, true);
	}, []);

	return { isSelected, treeContainerRef };
};
