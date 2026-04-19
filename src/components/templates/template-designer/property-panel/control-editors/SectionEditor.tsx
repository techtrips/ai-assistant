import {
	Input,
	Switch,
	Dropdown,
	Option,
	SpinButton,
} from "@fluentui/react-components";
import type {
	ISectionControl,
	SectionLayout,
	FooterAlignment,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import { StyleEditor } from "../style-editor/StyleEditor";
import type { EditorClasses } from "../PropertyPanel.models";
import {
	LAYOUT_OPTIONS,
	FOOTER_ALIGNMENT_OPTIONS,
} from "../PropertyPanel.models";

export const SectionEditor = ({
	section,
	onUpdateSection,
	classes,
	bindingPaths,
	className,
}: {
	section: ISectionControl;
	onUpdateSection: (
		sectionId: string,
		partial: Partial<ISectionControl>,
	) => void;
	classes: EditorClasses;
	bindingPaths: string[];
	className?: string;
}) => {
	const label =
		typeof section.label === "string"
			? section.label
			: (section.label?.value ?? "");

	return (
		<div className={className}>
			<CollapsibleSection title="General" classes={classes}>
				<FieldGroup label="ID" className={classes.field}>
					<Input size="small" value={section.id} readOnly />
				</FieldGroup>
				<FieldGroup label="Label" className={classes.field}>
					<Input
						size="small"
						value={label}
						onChange={(_, d) => onUpdateSection(section.id, { label: d.value })}
					/>
				</FieldGroup>
				<FieldGroup label="Label Binding" className={classes.field}>
					<BindingEditor
						placeholder="e.g. section.title"
						bindingPaths={bindingPaths}
						value={
							typeof section.label === "object"
								? (section.label?.binding ?? "")
								: ""
						}
						onChange={(v) =>
							onUpdateSection(section.id, {
								label: v ? { value: label, binding: v } : label,
							})
						}
					/>
				</FieldGroup>
			</CollapsibleSection>

			<CollapsibleSection title="Layout" classes={classes}>
				<FieldGroup label="Direction" className={classes.field}>
					<Dropdown
						size="small"
						value={section.layout ?? "stack"}
						selectedOptions={[section.layout ?? "stack"]}
						onOptionSelect={(_, d) =>
							onUpdateSection(section.id, {
								layout: d.optionValue as SectionLayout,
							})
						}
					>
						{LAYOUT_OPTIONS.map((l) => (
							<Option key={l} value={l}>
								{l}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
				<div className={classes.row}>
					<FieldGroup label="Columns" className={classes.halfField}>
						<SpinButton
							size="small"
							value={section.columns ?? 1}
							min={1}
							max={12}
							onChange={(_, d) =>
								onUpdateSection(section.id, { columns: d.value ?? undefined })
							}
						/>
					</FieldGroup>
					<FieldGroup label="Gap" className={classes.halfField}>
						<SpinButton
							size="small"
							value={section.gap ?? 0}
							min={0}
							max={64}
							onChange={(_, d) =>
								onUpdateSection(section.id, { gap: d.value ?? undefined })
							}
						/>
					</FieldGroup>
				</div>
				<FieldGroup label="Height" className={classes.field}>
					<Input
						size="small"
						placeholder="e.g. 300px, 50vh"
						value={section.height != null ? String(section.height) : ""}
						onChange={(_, d) =>
							onUpdateSection(section.id, { height: d.value || undefined })
						}
					/>
				</FieldGroup>
				<div className={classes.row}>
					<Switch
						label="Collapsible"
						checked={section.isCollapsible ?? false}
						onChange={(_, d) =>
							onUpdateSection(section.id, { isCollapsible: d.checked })
						}
					/>
					<Switch
						label="Default Expanded"
						checked={section.defaultExpanded ?? true}
						onChange={(_, d) =>
							onUpdateSection(section.id, { defaultExpanded: d.checked })
						}
					/>
				</div>
			</CollapsibleSection>

			<CollapsibleSection title="Footer" classes={classes}>
				<FieldGroup label="Alignment" className={classes.field}>
					<Dropdown
						size="small"
						value={section.footerAlignment ?? "end"}
						selectedOptions={[section.footerAlignment ?? "end"]}
						onOptionSelect={(_, d) =>
							onUpdateSection(section.id, {
								footerAlignment: d.optionValue as FooterAlignment,
							})
						}
					>
						{FOOTER_ALIGNMENT_OPTIONS.map((a) => (
							<Option key={a} value={a}>
								{a}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
			</CollapsibleSection>

			<StyleEditor
				style={section.style}
				onChange={(s) => onUpdateSection(section.id, { style: s })}
				classes={classes}
			/>
		</div>
	);
};
