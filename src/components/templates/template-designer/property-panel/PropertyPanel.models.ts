import type {
	ITemplate,
	ISectionControl,
	ITemplateControl,
	SectionLayout,
	BadgeColor,
	ButtonAppearance,
	FormInputType,
	FooterAlignment,
	ButtonPlacement,
} from "../../templates.models";
import type { ISelectedElement } from "../TemplateDesigner.models";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IPropertyPanelProps {
	template: ITemplate;
	selectedElement?: ISelectedElement;
	onTemplateChange: (template: ITemplate) => void;
	onSelectElement?: (element: ISelectedElement) => void;
	bindingPaths?: string[];
	bindingData?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Shared editor class tokens consumed by sub-editors
// ---------------------------------------------------------------------------

export type CollapsibleClasses = {
	sectionGroup: string;
	sectionHeader: string;
	sectionTitle: string;
	sectionChevron: string;
	sectionChevronCollapsed: string;
	sectionBody: string;
	sectionBodyHidden: string;
};

export type EditorClasses = CollapsibleClasses & {
	field: string;
	row: string;
	halfField: string;
	columnCard: string;
	columnHeader: string;
	addColumnBtn: string;
};

// ---------------------------------------------------------------------------
// Option constants
// ---------------------------------------------------------------------------

export const LAYOUT_OPTIONS: SectionLayout[] = ["stack", "row", "grid"];

export const FOOTER_ALIGNMENT_OPTIONS: FooterAlignment[] = [
	"start",
	"center",
	"end",
	"space-between",
];

export const BUTTON_PLACEMENT_OPTIONS: ButtonPlacement[] = [
	"inline",
	"header",
	"footer",
];

export const BADGE_COLORS: BadgeColor[] = [
	"brand",
	"danger",
	"important",
	"informative",
	"severe",
	"subtle",
	"success",
	"warning",
];

export const BUTTON_APPEARANCES: ButtonAppearance[] = [
	"primary",
	"secondary",
	"outline",
	"subtle",
	"transparent",
];

export const FIELD_FORMATS = ["text", "date", "currency", "number"] as const;

export const TABLE_COL_FORMATS = [
	"text",
	"date",
	"currency",
	"number",
	"badge",
	"button",
] as const;

export const FORM_INPUT_TYPES: FormInputType[] = [
	"text",
	"textarea",
	"number",
	"date",
	"dropdown",
	"checkbox",
	"toggle",
	"radio",
];

export const TEXT_ALIGN_OPTIONS = ["left", "center", "right"] as const;
export const OVERFLOW_OPTIONS = [
	"visible",
	"hidden",
	"scroll",
	"auto",
] as const;
export const ALIGN_SELF_OPTIONS = [
	"auto",
	"flex-start",
	"flex-end",
	"center",
	"stretch",
] as const;
export const BORDER_STYLE_OPTIONS = [
	"solid",
	"dashed",
	"dotted",
	"none",
] as const;

// ---------------------------------------------------------------------------
// Tree helpers — deep-find / deep-update
// ---------------------------------------------------------------------------

export const findSection = (
	sections: ISectionControl[] | undefined,
	id: string,
): ISectionControl | undefined => {
	if (!sections) return undefined;
	for (const s of sections) {
		if (s.id === id) return s;
		const found = findSection(s.subsections, id);
		if (found) return found;
	}
	return undefined;
};

export const findControl = (
	template: ITemplate,
	controlId: string,
): { control: ITemplateControl; sectionId: string } | undefined => {
	// Search within a list of controls
	const searchControls = (
		controls: ITemplateControl[],
		parentId: string,
	): { control: ITemplateControl; sectionId: string } | undefined => {
		for (const c of controls) {
			if (c.id === controlId) return { control: c, sectionId: parentId };
		}
		return undefined;
	};

	if (template.card.children) {
		const found = searchControls(template.card.children, "__card__");
		if (found) return found;
	}

	const searchSection = (
		section: ISectionControl,
	): { control: ITemplateControl; sectionId: string } | undefined => {
		if (section.children) {
			const found = searchControls(section.children, section.id);
			if (found) return found;
		}
		for (const sub of section.subsections ?? []) {
			const found = searchSection(sub);
			if (found) return found;
		}
		return undefined;
	};

	for (const section of template.card.sections ?? []) {
		const found = searchSection(section);
		if (found) return found;
	}
	return undefined;
};

export const updateSectionInList = (
	sections: ISectionControl[],
	id: string,
	updater: (s: ISectionControl) => ISectionControl,
): ISectionControl[] =>
	sections.map((s) =>
		s.id === id
			? updater(s)
			: {
					...s,
					subsections: s.subsections
						? updateSectionInList(s.subsections, id, updater)
						: undefined,
				},
	);

const updateControlInList = (
	controls: ITemplateControl[],
	controlId: string,
	updater: (c: ITemplateControl) => ITemplateControl,
): ITemplateControl[] =>
	controls.map((c) => {
		if (c.id === controlId) return updater(c);
		return c;
	});

export const updateControlInSections = (
	sections: ISectionControl[],
	controlId: string,
	updater: (c: ITemplateControl) => ITemplateControl,
): ISectionControl[] =>
	sections.map((s) => ({
		...s,
		children: s.children
			? updateControlInList(s.children, controlId, updater)
			: undefined,
		subsections: s.subsections
			? updateControlInSections(s.subsections, controlId, updater)
			: undefined,
	}));
