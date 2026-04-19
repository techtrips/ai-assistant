import type {
	ITemplate,
	ISectionControl,
	ITemplateControl,
} from "../templates.models";
import { ControlType } from "../templates.models";
import {
	IEntity,
	ISelectedElement,
	ITemplateDesignerProps,
	ITemplateDesignerState,
	TemplateDesignerActionType,
	TemplateDesignerMode,
} from "./TemplateDesigner.models";

export enum TEMPLATE_DESIGNER_DISPATCH_ACTIONS {
	SET_TEMPLATE = "SET_TEMPLATE",
	SET_MODE = "SET_MODE",
	SET_SELECTED_ELEMENT = "SET_SELECTED_ELEMENT",
	SET_IS_DIRTY = "SET_IS_DIRTY",
	SET_BINDING_PATHS = "SET_BINDING_PATHS",
	SET_BINDING_DATA = "SET_BINDING_DATA",
}

export type ITemplateDesignerDispatchActions =
	| {
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_TEMPLATE;
			data: IEntity<ITemplate>;
	  }
	| {
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_MODE;
			data: TemplateDesignerMode;
	  }
	| {
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_SELECTED_ELEMENT;
			data?: ISelectedElement;
	  }
	| {
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_IS_DIRTY;
			data: boolean;
	  }
	| {
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_BINDING_PATHS;
			data: string[];
	  }
	| {
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_BINDING_DATA;
			data: Record<string, unknown>;
	  };

export interface ITemplateDesignerActions {
	initialize: (template?: ITemplate, error?: string) => void;
	handleAction: (action: TemplateDesignerActionType, payload?: unknown) => void;
	save: () => void;
	revert: () => void;
	setMode: (mode: TemplateDesignerMode) => void;
	selectElement: (element?: ISelectedElement) => void;
	updateTemplate: (template: ITemplate) => void;
	addSection: (parentSectionId?: string) => void;
	removeSection: (sectionId: string) => void;
	addControl: (sectionId: string, controlType: ControlType) => void;
	removeControl: (sectionId: string, controlId: string) => void;
	addControlToCard: (controlType: ControlType) => void;
	removeControlFromCard: (controlId: string) => void;
	moveNode: (drag: IDragItem, drop: IDropTarget) => void;
	setBindingPaths: (paths: string[]) => void;
	setBindingData: (data: Record<string, unknown>) => void;
}

/** Describes the item being dragged. */
export interface IDragItem {
	type: "control" | "section";
	id: string;
	/** For controls only — the parent id ('card' or sectionId). */
	parentId?: string;
}

/** Describes where an item was dropped. */
export interface IDropTarget {
	/** The parent that should receive the item ('card' or sectionId). */
	parentId: string;
	/** Index within that parent's children/sections array. */
	index: number;
}

export class TemplateDesignerActions implements ITemplateDesignerActions {
	private readonly dispatch: React.Dispatch<ITemplateDesignerDispatchActions>;
	private readonly getState: () => ITemplateDesignerState;
	private props: ITemplateDesignerProps;
	private savedTemplate: ITemplate | undefined;

	constructor(
		dispatch: React.Dispatch<ITemplateDesignerDispatchActions>,
		getState: () => ITemplateDesignerState,
		props: ITemplateDesignerProps,
	) {
		this.dispatch = dispatch;
		this.getState = getState;
		this.props = props;
	}

	updateProps = (props: ITemplateDesignerProps) => {
		this.props = props;
	};

	initialize = (template?: ITemplate, error?: string) => {
		const tmpl = template ?? this.createDefaultTemplate();
		this.savedTemplate = tmpl;
		if (error) {
			this.dispatch({
				type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_TEMPLATE,
				data: { data: this.createDefaultTemplate(), loading: false, error },
			});
		} else {
			this.dispatch({
				type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_TEMPLATE,
				data: { data: tmpl, loading: false },
			});
		}
	};

	handleAction = (action: TemplateDesignerActionType, payload?: unknown) => {
		switch (action) {
			case TemplateDesignerActionType.Save:
				this.save();
				break;
			case TemplateDesignerActionType.SetMode:
				this.setMode(payload as TemplateDesignerMode);
				break;
			case TemplateDesignerActionType.SelectElement:
				this.selectElement(payload as ISelectedElement | undefined);
				break;
			default:
				break;
		}
	};

	save = () => {
		const { template } = this.getState();
		if (template.data) {
			this.savedTemplate = template.data;
			this.props.onSave?.(template.data, this.getState().bindingData);
			this.dispatch({
				type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_IS_DIRTY,
				data: false,
			});
		}
	};

	revert = () => {
		if (this.savedTemplate) {
			this.dispatch({
				type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_TEMPLATE,
				data: { data: this.savedTemplate, loading: false },
			});
			this.dispatch({
				type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_IS_DIRTY,
				data: false,
			});
			this.selectElement(undefined);
		}
	};

	setMode = (mode: TemplateDesignerMode) => {
		this.dispatch({
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_MODE,
			data: mode,
		});
	};

	selectElement = (element?: ISelectedElement) => {
		this.dispatch({
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_SELECTED_ELEMENT,
			data: element,
		});
	};

	updateTemplate = (template: ITemplate) => {
		this.dispatch({
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_TEMPLATE,
			data: { data: template, loading: false },
		});
		this.dispatch({
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_IS_DIRTY,
			data: true,
		});
	};

	addSection = (parentSectionId?: string) => {
		const { template } = this.getState();
		if (!template.data) return;
		const newSection: ISectionControl = {
			id: crypto.randomUUID().slice(0, 8),
			label: "New Section",
			isCollapsible: true,
			children: [],
		};
		let updatedSections: ISectionControl[];
		const card = template.data.card;
		let updatedOrdering = card.ordering;
		if (parentSectionId) {
			updatedSections = this.addSubsection(
				card.sections ?? [],
				parentSectionId,
				newSection,
			);
			// Update parent section's ordering
			updatedSections = this.appendToSectionOrdering(
				updatedSections,
				parentSectionId,
				newSection.id,
			);
		} else {
			updatedSections = [...(card.sections ?? []), newSection];
			updatedOrdering = [
				...(card.ordering ??
					this.buildOrdering(card.children ?? [], card.sections ?? [])),
				newSection.id,
			];
		}
		this.updateTemplate({
			...template.data,
			card: { ...card, sections: updatedSections, ordering: updatedOrdering },
		});
		this.selectElement({ type: "section", id: newSection.id });
	};

	removeSection = (sectionId: string) => {
		const { template } = this.getState();
		if (!template.data) return;
		const card = template.data.card;
		const updatedSections = this.removeSectionFromList(
			card.sections ?? [],
			sectionId,
		);
		const updatedOrdering = card.ordering?.filter((id) => id !== sectionId);
		this.updateTemplate({
			...template.data,
			card: { ...card, sections: updatedSections, ordering: updatedOrdering },
		});
		this.selectElement(undefined);
	};

	addControl = (sectionId: string, controlType: ControlType) => {
		const { template } = this.getState();
		if (!template.data) return;
		const newControl = this.createDefaultControl(controlType);
		const updatedSections = this.addControlToSection(
			template.data.card.sections ?? [],
			sectionId,
			newControl,
		);
		// Append to section ordering
		const finalSections = this.appendToSectionOrdering(
			updatedSections,
			sectionId,
			newControl.id,
		);
		this.updateTemplate({
			...template.data,
			card: { ...template.data.card, sections: finalSections },
		});
		this.selectElement({ type: "control", id: newControl.id });
	};

	removeControl = (sectionId: string, controlId: string) => {
		const { template } = this.getState();
		if (!template.data) return;
		const updatedSections = this.removeControlFromSection(
			template.data.card.sections ?? [],
			sectionId,
			controlId,
		);
		// Remove from section ordering
		const finalSections = this.removeFromSectionOrdering(
			updatedSections,
			sectionId,
			controlId,
		);
		this.updateTemplate({
			...template.data,
			card: { ...template.data.card, sections: finalSections },
		});
		this.selectElement(undefined);
	};

	addControlToCard = (controlType: ControlType) => {
		const { template } = this.getState();
		if (!template.data) return;
		const card = template.data.card;
		const newControl = this.createDefaultControl(controlType);
		const updatedOrdering = [
			...(card.ordering ??
				this.buildOrdering(card.children ?? [], card.sections ?? [])),
			newControl.id,
		];
		this.updateTemplate({
			...template.data,
			card: {
				...card,
				children: [...(card.children ?? []), newControl],
				ordering: updatedOrdering,
			},
		});
		this.selectElement({ type: "control", id: newControl.id });
	};

	removeControlFromCard = (controlId: string) => {
		const { template } = this.getState();
		if (!template.data) return;
		const card = template.data.card;
		this.updateTemplate({
			...template.data,
			card: {
				...card,
				children: (card.children ?? []).filter((c) => c.id !== controlId),
				ordering: card.ordering?.filter((id) => id !== controlId),
			},
		});
		this.selectElement(undefined);
	};

	setBindingPaths = (paths: string[]) => {
		this.dispatch({
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_BINDING_PATHS,
			data: paths,
		});
	};

	setBindingData = (data: Record<string, unknown>) => {
		this.dispatch({
			type: TEMPLATE_DESIGNER_DISPATCH_ACTIONS.SET_BINDING_DATA,
			data,
		});
	};

	moveNode = (drag: IDragItem, drop: IDropTarget) => {
		const { template } = this.getState();
		if (!template.data) return;

		const card = template.data.card;
		let cardChildren = [...(card.children ?? [])];
		let sections = this.deepCloneSections(card.sections ?? []);
		let cardOrdering = [
			...(card.ordering ??
				this.buildOrdering(cardChildren, card.sections ?? [])),
		];

		// ── Helper: get / set ordering for a section ──
		const getSectionOrdering = (sec: ISectionControl): string[] =>
			sec.ordering ??
			this.buildOrdering(sec.children ?? [], sec.subsections ?? []);
		const setSectionOrdering = (
			secs: ISectionControl[],
			sectionId: string,
			ordering: string[],
		): ISectionControl[] =>
			secs.map((s) => {
				if (s.id === sectionId) return { ...s, ordering };
				if (s.subsections)
					return {
						...s,
						subsections: setSectionOrdering(s.subsections, sectionId, ordering),
					};
				return s;
			});

		// ── 1. Remove the dragged item from its source ──
		if (drag.type === "control") {
			let control: ITemplateControl | undefined;
			if (drag.parentId === "card") {
				const idx = cardChildren.findIndex((c) => c.id === drag.id);
				if (idx === -1) return;
				control = cardChildren[idx];
				cardChildren.splice(idx, 1);
				cardOrdering = cardOrdering.filter((id) => id !== drag.id);
			} else {
				const result = this.extractControlFromSections(
					sections,
					drag.parentId!,
					drag.id,
				);
				control = result.control;
				sections = result.sections;
				// Remove from source section's ordering
				const srcSec = this.findSection(sections, drag.parentId!);
				if (srcSec) {
					sections = setSectionOrdering(
						sections,
						drag.parentId!,
						getSectionOrdering(srcSec).filter((id) => id !== drag.id),
					);
				}
			}
			if (!control) return;

			// ── 2. Insert control at target ──
			if (drop.parentId === "card") {
				// Determine insertion index in children array: append at end
				cardChildren.push(control);
				// Insert in ordering at the unified drop index
				const adjustedDropIndex = this.adjustOrderingIndex(
					cardOrdering,
					drop.index,
					drag.parentId === "card",
				);
				cardOrdering.splice(adjustedDropIndex, 0, control.id);
			} else {
				sections = this.insertControlIntoSections(
					sections,
					drop.parentId,
					this.findSection(sections, drop.parentId)?.children?.length ?? 0,
					control,
				);
				// Insert in target section's ordering
				const tgtSec = this.findSection(sections, drop.parentId);
				if (tgtSec) {
					const tgtOrdering = getSectionOrdering(tgtSec);
					const adjustedDropIndex = this.adjustOrderingIndex(
						tgtOrdering,
						drop.index,
						drag.parentId === drop.parentId,
					);
					tgtOrdering.splice(adjustedDropIndex, 0, control.id);
					sections = setSectionOrdering(sections, drop.parentId, tgtOrdering);
				}
			}
		} else {
			// ── Moving a section ──
			const result = this.extractSection(sections, drag.id);
			const section = result.section;
			sections = result.sections;
			if (!section) return;

			// Remove from source ordering
			if (drag.parentId === "card") {
				cardOrdering = cardOrdering.filter((id) => id !== drag.id);
			} else {
				const srcSec = this.findSection(sections, drag.parentId!);
				if (srcSec) {
					sections = setSectionOrdering(
						sections,
						drag.parentId!,
						getSectionOrdering(srcSec).filter((id) => id !== drag.id),
					);
				}
			}

			// Insert section at target
			if (drop.parentId === "card") {
				sections.push(section);
				const adjustedDropIndex = this.adjustOrderingIndex(
					cardOrdering,
					drop.index,
					drag.parentId === "card",
				);
				cardOrdering.splice(adjustedDropIndex, 0, section.id);
			} else {
				sections = this.insertSectionIntoSections(
					sections,
					drop.parentId,
					this.findSection(sections, drop.parentId)?.subsections?.length ?? 0,
					section,
				);
				const tgtSec = this.findSection(sections, drop.parentId);
				if (tgtSec) {
					const tgtOrdering = getSectionOrdering(tgtSec);
					const adjustedDropIndex = this.adjustOrderingIndex(
						tgtOrdering,
						drop.index,
						drag.parentId === drop.parentId,
					);
					tgtOrdering.splice(adjustedDropIndex, 0, section.id);
					sections = setSectionOrdering(sections, drop.parentId, tgtOrdering);
				}
			}
		}

		this.updateTemplate({
			...template.data,
			card: {
				...card,
				children: cardChildren,
				sections,
				ordering: cardOrdering,
			},
		});
	};

	private findSection = (
		sections: ISectionControl[],
		id: string,
	): ISectionControl | undefined => {
		for (const s of sections) {
			if (s.id === id) return s;
			if (s.subsections) {
				const found = this.findSection(s.subsections, id);
				if (found) return found;
			}
		}
		return undefined;
	};

	/** Build a default ordering from separate children + sections arrays. */
	private buildOrdering = (
		children: ITemplateControl[],
		sections: ISectionControl[],
	): string[] => [...children.map((c) => c.id), ...sections.map((s) => s.id)];

	/**
	 * Clamp the unified drop index to the ordering length.
	 * The item was already removed from the ordering before calling this,
	 * so no same-parent adjustment is needed.
	 */
	private adjustOrderingIndex = (
		ordering: string[],
		index: number,
		_sameParent: boolean,
	): number => Math.min(index, ordering.length);

	private deepCloneSections = (
		sections: ISectionControl[],
	): ISectionControl[] =>
		sections.map((s) => ({
			...s,
			children: s.children ? [...s.children] : undefined,
			subsections: s.subsections
				? this.deepCloneSections(s.subsections)
				: undefined,
			ordering: s.ordering ? [...s.ordering] : undefined,
		}));

	private extractControlFromSections = (
		sections: ISectionControl[],
		sectionId: string,
		controlId: string,
	): { sections: ISectionControl[]; control?: ITemplateControl } => {
		let found: ITemplateControl | undefined;
		const updated = sections.map((s) => {
			if (found) return s;
			if (s.id === sectionId) {
				const idx = (s.children ?? []).findIndex((c) => c.id === controlId);
				if (idx !== -1) {
					const children = [...(s.children ?? [])];
					found = children.splice(idx, 1)[0];
					return { ...s, children };
				}
			}
			if (s.subsections) {
				const res = this.extractControlFromSections(
					s.subsections,
					sectionId,
					controlId,
				);
				if (res.control) {
					found = res.control;
					return { ...s, subsections: res.sections };
				}
			}
			return s;
		});
		return { sections: updated, control: found };
	};

	private insertControlIntoSections = (
		sections: ISectionControl[],
		sectionId: string,
		index: number,
		control: ITemplateControl,
	): ISectionControl[] =>
		sections.map((s) => {
			if (s.id === sectionId) {
				const children = [...(s.children ?? [])];
				children.splice(index, 0, control);
				return { ...s, children };
			}
			if (s.subsections) {
				return {
					...s,
					subsections: this.insertControlIntoSections(
						s.subsections,
						sectionId,
						index,
						control,
					),
				};
			}
			return s;
		});

	private extractSection = (
		sections: ISectionControl[],
		sectionId: string,
	): { sections: ISectionControl[]; section?: ISectionControl } => {
		let found: ISectionControl | undefined;
		const filtered = sections.filter((s) => {
			if (s.id === sectionId) {
				found = s;
				return false;
			}
			return true;
		});
		if (found) return { sections: filtered, section: found };
		const updated = filtered.map((s) => {
			if (found) return s;
			if (s.subsections) {
				const res = this.extractSection(s.subsections, sectionId);
				if (res.section) {
					found = res.section;
					return { ...s, subsections: res.sections };
				}
			}
			return s;
		});
		return { sections: updated, section: found };
	};

	private insertSectionIntoSections = (
		sections: ISectionControl[],
		parentId: string,
		index: number,
		section: ISectionControl,
	): ISectionControl[] =>
		sections.map((s) => {
			if (s.id === parentId) {
				const subs = [...(s.subsections ?? [])];
				subs.splice(index, 0, section);
				return { ...s, subsections: subs };
			}
			if (s.subsections) {
				return {
					...s,
					subsections: this.insertSectionIntoSections(
						s.subsections,
						parentId,
						index,
						section,
					),
				};
			}
			return s;
		});

	private addSubsection = (
		sections: ISectionControl[],
		parentId: string,
		newSection: ISectionControl,
	): ISectionControl[] =>
		sections.map((s) =>
			s.id === parentId
				? { ...s, subsections: [...(s.subsections ?? []), newSection] }
				: {
						...s,
						subsections: s.subsections
							? this.addSubsection(s.subsections, parentId, newSection)
							: undefined,
					},
		);

	private removeSectionFromList = (
		sections: ISectionControl[],
		sectionId: string,
	): ISectionControl[] =>
		sections
			.filter((s) => s.id !== sectionId)
			.map((s) => ({
				...s,
				ordering: s.ordering?.filter((id) => id !== sectionId),
				subsections: s.subsections
					? this.removeSectionFromList(s.subsections, sectionId)
					: undefined,
			}));

	private addControlToSection = (
		sections: ISectionControl[],
		sectionId: string,
		control: ITemplateControl,
	): ISectionControl[] =>
		sections.map((s) =>
			s.id === sectionId
				? { ...s, children: [...(s.children ?? []), control] }
				: {
						...s,
						subsections: s.subsections
							? this.addControlToSection(s.subsections, sectionId, control)
							: undefined,
					},
		);

	private removeControlFromSection = (
		sections: ISectionControl[],
		sectionId: string,
		controlId: string,
	): ISectionControl[] =>
		sections.map((s) =>
			s.id === sectionId
				? {
						...s,
						children: (s.children ?? []).filter((c) => c.id !== controlId),
						ordering: s.ordering?.filter((id) => id !== controlId),
					}
				: {
						...s,
						subsections: s.subsections
							? this.removeControlFromSection(
									s.subsections,
									sectionId,
									controlId,
								)
							: undefined,
					},
		);

	/** Append an item id to a section's ordering (recursive). */
	private appendToSectionOrdering = (
		sections: ISectionControl[],
		sectionId: string,
		itemId: string,
	): ISectionControl[] =>
		sections.map((s) => {
			if (s.id === sectionId) {
				const ordering =
					s.ordering ??
					this.buildOrdering(s.children ?? [], s.subsections ?? []);
				return { ...s, ordering: [...ordering, itemId] };
			}
			if (s.subsections) {
				return {
					...s,
					subsections: this.appendToSectionOrdering(
						s.subsections,
						sectionId,
						itemId,
					),
				};
			}
			return s;
		});

	/** Remove an item id from a section's ordering (recursive). */
	private removeFromSectionOrdering = (
		sections: ISectionControl[],
		sectionId: string,
		itemId: string,
	): ISectionControl[] =>
		sections.map((s) => {
			if (s.id === sectionId) {
				return { ...s, ordering: s.ordering?.filter((id) => id !== itemId) };
			}
			if (s.subsections) {
				return {
					...s,
					subsections: this.removeFromSectionOrdering(
						s.subsections,
						sectionId,
						itemId,
					),
				};
			}
			return s;
		});

	private createDefaultControl = (type: ControlType): ITemplateControl => {
		const id = crypto.randomUUID().slice(0, 8);
		switch (type) {
			case ControlType.Field:
				return {
					id,
					type: ControlType.Field,
					label: "New Field",
					format: "text",
				};
			case ControlType.Button:
				return {
					id,
					type: ControlType.Button,
					label: "New Button",
					prompt: "",
					appearance: "secondary",
				};
			case ControlType.Table:
				return {
					id,
					type: ControlType.Table,
					label: "New Table",
					columns: [{ key: "col1", header: "Column 1" }],
				};
			case ControlType.Badge:
				return {
					id,
					type: ControlType.Badge,
					label: "New Badge",
					color: "informative",
				};
			case ControlType.Image:
				return {
					id,
					type: ControlType.Image,
					label: "New Image",
					alt: "Image",
				};
			case ControlType.ProgressBar:
				return {
					id,
					type: ControlType.ProgressBar,
					label: "Progress",
					value: 0,
					max: 100,
				};
			case ControlType.InputField:
				return {
					id,
					type: ControlType.InputField,
					name: `field_${id}`,
					label: "New Input Field",
					inputType: "text",
					placeholder: "Enter value",
				};
			case ControlType.Separator:
				return {
					id,
					type: ControlType.Separator,
				};
		}
	};

	private createDefaultTemplate = (): ITemplate => ({
		id: crypto.randomUUID(),
		name: "New Template",
		version: "1.0",
		card: {
			title: "New Card",
			sections: [],
		},
	});
}
