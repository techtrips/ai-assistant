import React, { useMemo } from "react";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { layoutStyles } from "./ControlRenderer.styles";
import type {
	ITemplateControl,
	IControlProps,
	SectionLayout,
	IFieldControl,
	IBadgeControl,
	IButtonControl,
	ITableControl,
	IImageControl,
	IProgressBarControl,
	IInputFieldControl,
	ControlValue,
} from "../../templates.models";
import { ControlType } from "../../templates.models";
import { resolveBinding, resolveDataBindings } from "../bindingResolver";
import { Field } from "../../common/field/Field";
import { Badge } from "../../common/badge/Badge";
import { Button } from "../../common/button/Button";
import { Table } from "../../common/table/Table";
import { ImageControl } from "../../common/image/Image";
import { ProgressBar } from "../../common/progress-bar/ProgressBar";
import { Separator } from "../../common/separator/Separator";
import { useFormContext } from "../../common/form/FormContext";
import { FormInput } from "../../common/form/FormInput";

const useLayoutStyles = makeStyles(layoutStyles);

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isControlValue(v: unknown): v is ControlValue {
	return (
		v === null ||
		v === undefined ||
		typeof v === "string" ||
		typeof v === "number" ||
		typeof v === "boolean"
	);
}

// ---------------------------------------------------------------------------
// Binding resolution helpers — resolve bindings before passing to components
// ---------------------------------------------------------------------------

function resolveField(
	control: IFieldControl,
	data: Record<string, unknown>,
): IFieldControl {
	if (!control.binding) return control;
	const resolved = resolveBinding(control.binding, data);
	return {
		...control,
		value: isControlValue(resolved) ? resolved : String(resolved ?? ""),
	};
}

function resolveBadge(
	control: IBadgeControl,
	data: Record<string, unknown>,
): IBadgeControl {
	const resolvedValue = control.binding
		? resolveBinding(control.binding, data)
		: undefined;
	const resolvedColor = control.colorBinding
		? resolveBinding(control.colorBinding, data)
		: undefined;
	return {
		...control,
		value: control.binding ? String(resolvedValue ?? "") : control.value,
		color: control.colorBinding
			? typeof resolvedColor === "string"
				? (resolvedColor as IBadgeControl["color"])
				: control.color
			: control.color,
	};
}

function resolveButton(
	control: IButtonControl,
	data: Record<string, unknown>,
): IButtonControl {
	if (!control.dataBindings) return control;
	return {
		...control,
		data: resolveDataBindings(control.data, control.dataBindings, data),
	};
}

function resolveTable(
	control: ITableControl,
	data: Record<string, unknown>,
): ITableControl {
	if (!control.binding) return control;
	const raw = resolveBinding(control.binding, data);

	// Support both arrays (multiple rows) and plain objects (single row)
	let rawRows: unknown[];
	if (Array.isArray(raw)) {
		rawRows = raw;
	} else if (raw != null && typeof raw === "object") {
		rawRows = [raw];
	} else {
		rawRows = [];
	}

	// Flatten col.field bindings so the Table gets plain row[col.key] values
	const rows = rawRows.map((row) => {
		if (row == null || typeof row !== "object") return {};
		const flat: Record<string, ControlValue> = {};
		for (const col of control.columns) {
			const cellVal = col.field
				? resolveBinding(col.field, row as Record<string, unknown>)
				: (row as Record<string, ControlValue>)[col.key];
			flat[col.key] = isControlValue(cellVal) ? cellVal : String(cellVal ?? "");
		}
		return flat;
	});

	return { ...control, rows, rawRows: rawRows as Record<string, unknown>[] };
}

function resolveImage(
	control: IImageControl,
	data: Record<string, unknown>,
): IImageControl {
	if (!control.binding) return control;
	const resolved = resolveBinding(control.binding, data);
	return {
		...control,
		src: typeof resolved === "string" ? resolved : String(resolved ?? ""),
	};
}

function resolveProgressBar(
	control: IProgressBarControl,
	data: Record<string, unknown>,
): IProgressBarControl {
	if (!control.binding) return control;
	const resolved = resolveBinding(control.binding, data);
	return {
		...control,
		value: typeof resolved === "number" ? resolved : Number(resolved ?? 0),
	};
}

function resolveInputFieldDefaults(
	controls: ITemplateControl[],
	data: Record<string, unknown>,
): ITemplateControl[] {
	return controls.map((c) => {
		if (c.type !== ControlType.InputField) return c;
		const field = c as IInputFieldControl;
		if (!field.defaultValue?.binding) return c;
		const resolved = resolveBinding(field.defaultValue.binding, data);
		return {
			...field,
			defaultValue: {
				...field.defaultValue,
				value: isControlValue(resolved) ? resolved : String(resolved ?? ""),
			},
		};
	});
}

// ---------------------------------------------------------------------------
// Single control dispatcher
// ---------------------------------------------------------------------------

export interface IControlRendererProps extends IControlProps {
	control: ITemplateControl;
	data?: Record<string, unknown>;
}

export const ControlRenderer: React.FC<IControlRendererProps> = ({
	control,
	data = {},
	onAction,
}) => {
	if (control.visible === false) return null;

	switch (control.type) {
		case ControlType.Field:
			return <Field {...resolveField(control, data)} />;
		case ControlType.Badge:
			return <Badge {...resolveBadge(control, data)} />;
		case ControlType.Button:
			return (
				<Button
					{...resolveButton(control, data)}
					onAction={onAction}
					serverData={data}
				/>
			);
		case ControlType.Table:
			return (
				<Table
					{...resolveTable(control, data)}
					onAction={onAction}
					serverData={data}
				/>
			);
		case ControlType.Image:
			return <ImageControl {...resolveImage(control, data)} />;
		case ControlType.ProgressBar:
			return <ProgressBar {...resolveProgressBar(control, data)} />;
		case ControlType.InputField:
			return <InputFieldRenderer control={control as IInputFieldControl} />;
		case ControlType.Separator:
			return <Separator {...control} />;
		default:
			return null;
	}
};

/** InputField reads from the nearest FormContext. */
const InputFieldRenderer: React.FC<{ control: IInputFieldControl }> = ({
	control,
}) => {
	const formCtx = useFormContext();
	if (!formCtx) return null; // InputField only meaningful inside a form context
	return (
		<FormInput
			field={control}
			value={formCtx.values[control.name]}
			error={formCtx.errors[control.name]}
			onChange={formCtx.onChange}
		/>
	);
};

// ---------------------------------------------------------------------------
// Layout wrapper that renders a list of controls
// ---------------------------------------------------------------------------

export interface IChildrenLayoutProps extends IControlProps {
	controls?: ITemplateControl[];
	layout?: SectionLayout;
	columns?: number;
	gap?: number;
	data?: Record<string, unknown>;
}

export const ChildrenLayout: React.FC<IChildrenLayoutProps> = ({
	controls,
	layout,
	columns,
	gap,
	data = {},
	onAction,
}) => {
	const classes = useLayoutStyles();

	// Resolve InputField default-value bindings
	const resolvedControls = useMemo(
		() => (controls ? resolveInputFieldDefaults(controls, data) : undefined),
		[controls, data],
	);

	if (!resolvedControls?.length) return null;

	const layoutClass = getLayoutClass(classes, layout, columns);
	const gapClass = getGapClass(classes, gap);
	const className = gapClass
		? mergeClasses(layoutClass, gapClass)
		: layoutClass;

	return (
		<div className={className}>
			{resolvedControls.map((control) => (
				<ControlRenderer
					key={control.id}
					control={control}
					data={data}
					onAction={onAction}
				/>
			))}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLayoutClass(
	classes: ReturnType<typeof useLayoutStyles>,
	layout?: SectionLayout,
	columns?: number,
): string {
	switch (layout) {
		case "row":
			return classes.row;
		case "grid": {
			const cols = columns ?? 2;
			return cols === 3
				? classes.grid3
				: cols >= 4
					? classes.grid4
					: classes.grid2;
		}
		default:
			return classes.stack;
	}
}

function getGapClass(
	classes: ReturnType<typeof useLayoutStyles>,
	gap?: number,
): string | undefined {
	if (gap == null) return undefined;
	if (gap <= 4) return classes.gap4;
	if (gap <= 8) return classes.gap8;
	if (gap <= 16) return classes.gap16;
	if (gap <= 24) return classes.gap24;
	return undefined;
}
