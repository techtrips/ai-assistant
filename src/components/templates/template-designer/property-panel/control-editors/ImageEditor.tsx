import { Input } from "@fluentui/react-components";
import type {
	ITemplateControl,
	IImageControl,
} from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import { BindingEditor } from "./binding-editor/BindingEditor";
import type { EditorClasses } from "../PropertyPanel.models";

export const ImageEditor = ({
	control,
	onUpdate,
	classes,
	bindingPaths,
}: {
	control: IImageControl;
	onUpdate: (id: string, p: Partial<ITemplateControl>) => void;
	classes: EditorClasses;
	bindingPaths: string[];
}) => (
	<CollapsibleSection title="Image" classes={classes}>
		<FieldGroup label="Src" className={classes.field}>
			<Input
				size="small"
				value={control.src ?? ""}
				onChange={(_, d) =>
					onUpdate(control.id, {
						src: d.value || undefined,
					} as Partial<IImageControl>)
				}
			/>
		</FieldGroup>
		<FieldGroup label="Src Binding" className={classes.field}>
			<BindingEditor
				placeholder="e.g. product.imageUrl"
				bindingPaths={bindingPaths}
				value={control.binding ?? ""}
				onChange={(v) =>
					onUpdate(control.id, {
						binding: v || undefined,
					} as Partial<IImageControl>)
				}
			/>
		</FieldGroup>
		<FieldGroup label="Alt Text" className={classes.field}>
			<Input
				size="small"
				value={control.alt ?? ""}
				onChange={(_, d) =>
					onUpdate(control.id, {
						alt: d.value || undefined,
					} as Partial<IImageControl>)
				}
			/>
		</FieldGroup>
		<div className={classes.row}>
			<FieldGroup label="Width" className={classes.halfField}>
				<Input
					size="small"
					value={String(control.width ?? "")}
					onChange={(_, d) =>
						onUpdate(control.id, {
							width: d.value || undefined,
						} as Partial<IImageControl>)
					}
				/>
			</FieldGroup>
			<FieldGroup label="Height" className={classes.halfField}>
				<Input
					size="small"
					value={String(control.height ?? "")}
					onChange={(_, d) =>
						onUpdate(control.id, {
							height: d.value || undefined,
						} as Partial<IImageControl>)
					}
				/>
			</FieldGroup>
		</div>
	</CollapsibleSection>
);
