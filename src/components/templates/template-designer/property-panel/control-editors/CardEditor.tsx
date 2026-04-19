import {
	Input,
	Switch,
	Dropdown,
	Option,
	SpinButton,
} from "@fluentui/react-components";
import type {
	ITemplate,
	ICardControl,
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

export const CardEditor = ({
	template,
	onUpdateCard,
	onUpdateRoot,
	classes,
	bindingPaths,
	className,
}: {
	template: ITemplate;
	onUpdateCard: (partial: Partial<ICardControl>) => void;
	onUpdateRoot: (partial: Partial<ITemplate>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
	className?: string;
}) => {
	const title =
		typeof template.card.title === "string"
			? template.card.title
			: (template.card.title?.value ?? "");
	const subtitle =
		typeof template.card.subtitle === "string"
			? template.card.subtitle
			: (template.card.subtitle?.value ?? "");

	return (
		<div className={className}>
			<CollapsibleSection title="Template" classes={classes}>
				<FieldGroup label="Name" className={classes.field}>
					<Input
						size="small"
						value={template.name}
						onChange={(_, d) => onUpdateRoot({ name: d.value })}
					/>
				</FieldGroup>
				<FieldGroup label="Description" className={classes.field}>
					<Input
						size="small"
						value={template.description ?? ""}
						onChange={(_, d) => onUpdateRoot({ description: d.value })}
					/>
				</FieldGroup>
				<FieldGroup label="Version" className={classes.field}>
					<Input
						size="small"
						value={template.version}
						onChange={(_, d) => onUpdateRoot({ version: d.value })}
					/>
				</FieldGroup>
			</CollapsibleSection>

			<CollapsibleSection title="Card Content" classes={classes}>
				<FieldGroup label="Title" className={classes.field}>
					<Input
						size="small"
						value={title}
						onChange={(_, d) => onUpdateCard({ title: d.value })}
					/>
				</FieldGroup>
				<FieldGroup label="Title Binding" className={classes.field}>
					<BindingEditor
						placeholder="e.g. request.title"
						bindingPaths={bindingPaths}
						value={
							typeof template.card.title === "object"
								? (template.card.title?.binding ?? "")
								: ""
						}
						onChange={(v) =>
							onUpdateCard({
								title: v ? { value: title, binding: v } : title,
							})
						}
					/>
				</FieldGroup>
				<FieldGroup label="Subtitle" className={classes.field}>
					<Input
						size="small"
						value={subtitle}
						onChange={(_, d) =>
							onUpdateCard({ subtitle: d.value || undefined })
						}
					/>
				</FieldGroup>
			</CollapsibleSection>

			<CollapsibleSection title="Layout" classes={classes}>
				<FieldGroup label="Direction" className={classes.field}>
					<Dropdown
						size="small"
						value={template.card.layout ?? "stack"}
						selectedOptions={[template.card.layout ?? "stack"]}
						onOptionSelect={(_, d) =>
							onUpdateCard({ layout: d.optionValue as SectionLayout })
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
							value={template.card.columns ?? 1}
							min={1}
							max={12}
							onChange={(_, d) =>
								onUpdateCard({ columns: d.value ?? undefined })
							}
						/>
					</FieldGroup>
					<FieldGroup label="Gap" className={classes.halfField}>
						<SpinButton
							size="small"
							value={template.card.gap ?? 0}
							min={0}
							max={64}
							onChange={(_, d) => onUpdateCard({ gap: d.value ?? undefined })}
						/>
					</FieldGroup>
				</div>
				<FieldGroup label="Height" className={classes.field}>
					<Input
						size="small"
						placeholder="e.g. 400px, 50vh"
						value={
							template.card.height != null ? String(template.card.height) : ""
						}
						onChange={(_, d) => onUpdateCard({ height: d.value || undefined })}
					/>
				</FieldGroup>
				<div className={classes.row}>
					<Switch
						label="Collapsible"
						checked={template.card.isCollapsible ?? false}
						onChange={(_, d) => onUpdateCard({ isCollapsible: d.checked })}
					/>
					<Switch
						label="Default Expanded"
						checked={template.card.defaultExpanded ?? true}
						onChange={(_, d) => onUpdateCard({ defaultExpanded: d.checked })}
					/>
				</div>
			</CollapsibleSection>

			<CollapsibleSection title="Footer" classes={classes}>
				<FieldGroup label="Alignment" className={classes.field}>
					<Dropdown
						size="small"
						value={template.card.footerAlignment ?? "end"}
						selectedOptions={[template.card.footerAlignment ?? "end"]}
						onOptionSelect={(_, d) =>
							onUpdateCard({
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
				style={template.card.style}
				onChange={(s) => onUpdateCard({ style: s })}
				classes={classes}
			/>
		</div>
	);
};
