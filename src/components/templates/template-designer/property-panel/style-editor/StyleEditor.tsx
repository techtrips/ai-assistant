import { Input, Dropdown, Option } from "@fluentui/react-components";
import type { IControlStyle } from "../../../templates.models";
import { CollapsibleSection, FieldGroup } from "../CollapsibleSection";
import type { EditorClasses } from "../PropertyPanel.models";
import {
	TEXT_ALIGN_OPTIONS,
	OVERFLOW_OPTIONS,
	ALIGN_SELF_OPTIONS,
	BORDER_STYLE_OPTIONS,
} from "../PropertyPanel.models";

export const StyleEditor = ({
	style,
	onChange,
	classes,
}: {
	style?: IControlStyle;
	onChange: (style: IControlStyle | undefined) => void;
	classes: EditorClasses;
}) => {
	const s = style ?? {};

	const set = (key: keyof IControlStyle, value: unknown) => {
		const next = { ...s, [key]: value === "" ? undefined : value };
		for (const k of Object.keys(next) as (keyof IControlStyle)[]) {
			if (next[k] === undefined) delete next[k];
		}
		onChange(Object.keys(next).length > 0 ? next : undefined);
	};

	const strVal = (key: keyof IControlStyle) => String(s[key] ?? "");

	return (
		<CollapsibleSection title="Style" defaultExpanded={false} classes={classes}>
			{/* Sizing */}
			<div className={classes.row}>
				<FieldGroup label="Width" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("width")}
						onChange={(_, d) => set("width", d.value)}
						placeholder="e.g. 100% or 200px"
					/>
				</FieldGroup>
				<FieldGroup label="Height" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("height")}
						onChange={(_, d) => set("height", d.value)}
						placeholder="e.g. auto or 120px"
					/>
				</FieldGroup>
			</div>
			<div className={classes.row}>
				<FieldGroup label="Min Width" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("minWidth")}
						onChange={(_, d) => set("minWidth", d.value)}
					/>
				</FieldGroup>
				<FieldGroup label="Max Width" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("maxWidth")}
						onChange={(_, d) => set("maxWidth", d.value)}
					/>
				</FieldGroup>
			</div>

			{/* Spacing */}
			<div className={classes.row}>
				<FieldGroup label="Margin" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("margin")}
						onChange={(_, d) => set("margin", d.value)}
						placeholder="e.g. 8px or 4px 8px"
					/>
				</FieldGroup>
				<FieldGroup label="Padding" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("padding")}
						onChange={(_, d) => set("padding", d.value)}
						placeholder="e.g. 12px 16px"
					/>
				</FieldGroup>
			</div>

			{/* Typography */}
			<div className={classes.row}>
				<FieldGroup label="Font Size" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("fontSize")}
						onChange={(_, d) => set("fontSize", d.value)}
						placeholder="e.g. 14px"
					/>
				</FieldGroup>
				<FieldGroup label="Font Weight" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("fontWeight")}
						onChange={(_, d) => set("fontWeight", d.value)}
						placeholder="e.g. 600 or bold"
					/>
				</FieldGroup>
			</div>
			<div className={classes.row}>
				<FieldGroup label="Color" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("color")}
						onChange={(_, d) => set("color", d.value)}
						placeholder="e.g. #333 or red"
					/>
				</FieldGroup>
				<FieldGroup label="Text Align" className={classes.halfField}>
					<Dropdown
						size="small"
						style={{ minWidth: 0 }}
						value={strVal("textAlign") || "left"}
						selectedOptions={[strVal("textAlign") || "left"]}
						onOptionSelect={(_, d) =>
							set(
								"textAlign",
								d.optionValue === "left" ? undefined : d.optionValue,
							)
						}
					>
						{TEXT_ALIGN_OPTIONS.map((o) => (
							<Option key={o} value={o}>
								{o}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
			</div>

			{/* Background & border */}
			<div className={classes.row}>
				<FieldGroup label="Background" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("backgroundColor")}
						onChange={(_, d) => set("backgroundColor", d.value)}
						placeholder="e.g. #f5f5f5"
					/>
				</FieldGroup>
				<FieldGroup label="Border Radius" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("borderRadius")}
						onChange={(_, d) => set("borderRadius", d.value)}
						placeholder="e.g. 4px"
					/>
				</FieldGroup>
			</div>
			<div className={classes.row}>
				<FieldGroup label="Border Width" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("borderWidth")}
						onChange={(_, d) => set("borderWidth", d.value)}
						placeholder="e.g. 1px"
					/>
				</FieldGroup>
				<FieldGroup label="Border Style" className={classes.halfField}>
					<Dropdown
						size="small"
						style={{ minWidth: 0 }}
						value={strVal("borderStyle") || "none"}
						selectedOptions={[strVal("borderStyle") || "none"]}
						onOptionSelect={(_, d) =>
							set(
								"borderStyle",
								d.optionValue === "none" ? undefined : d.optionValue,
							)
						}
					>
						{BORDER_STYLE_OPTIONS.map((o) => (
							<Option key={o} value={o}>
								{o}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
			</div>
			<FieldGroup label="Border Color" className={classes.field}>
				<Input
					size="small"
					value={strVal("borderColor")}
					onChange={(_, d) => set("borderColor", d.value)}
					placeholder="e.g. #ccc"
				/>
			</FieldGroup>

			{/* Layout */}
			<div className={classes.row}>
				<FieldGroup label="Align Self" className={classes.halfField}>
					<Dropdown
						size="small"
						style={{ minWidth: 0 }}
						value={strVal("alignSelf") || "auto"}
						selectedOptions={[strVal("alignSelf") || "auto"]}
						onOptionSelect={(_, d) =>
							set(
								"alignSelf",
								d.optionValue === "auto" ? undefined : d.optionValue,
							)
						}
					>
						{ALIGN_SELF_OPTIONS.map((o) => (
							<Option key={o} value={o}>
								{o}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
				<FieldGroup label="Overflow" className={classes.halfField}>
					<Dropdown
						size="small"
						style={{ minWidth: 0 }}
						value={strVal("overflow") || "visible"}
						selectedOptions={[strVal("overflow") || "visible"]}
						onOptionSelect={(_, d) =>
							set(
								"overflow",
								d.optionValue === "visible" ? undefined : d.optionValue,
							)
						}
					>
						{OVERFLOW_OPTIONS.map((o) => (
							<Option key={o} value={o}>
								{o}
							</Option>
						))}
					</Dropdown>
				</FieldGroup>
			</div>
			<div className={classes.row}>
				<FieldGroup label="Flex" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("flex")}
						onChange={(_, d) => set("flex", d.value)}
						placeholder="e.g. 1 or 0 0 auto"
					/>
				</FieldGroup>
				<FieldGroup label="Opacity" className={classes.halfField}>
					<Input
						size="small"
						value={strVal("opacity")}
						onChange={(_, d) => {
							const num = d.value === "" ? undefined : Number(d.value);
							set("opacity", num != null && !isNaN(num) ? num : undefined);
						}}
						placeholder="0 – 1"
					/>
				</FieldGroup>
			</div>
		</CollapsibleSection>
	);
};
