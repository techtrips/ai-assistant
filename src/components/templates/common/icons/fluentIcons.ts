import React from "react";
import * as FluentIcons from "@fluentui/react-icons";
import type { FluentIconsProps } from "@fluentui/react-icons";

export type FluentIconComponent = React.ComponentType<FluentIconsProps>;

const ICON_NAME_PATTERN = /^(.*)20(Regular|Filled)$/;

const fluentIconEntries = Object.entries(FluentIcons)
	.filter(([name, value]) => {
		return ICON_NAME_PATTERN.test(name) && value != null;
	})
	.sort(([a], [b]) => a.localeCompare(b));

const iconByName = new Map<string, FluentIconComponent>(
	fluentIconEntries.map(([name, value]) => [
		name,
		value as FluentIconComponent,
	]),
);

export const FLUENT_ICON_ITEMS: Array<{
	name: string;
	Icon: FluentIconComponent;
}> = fluentIconEntries.map(([name, value]) => ({
	name,
	Icon: value as FluentIconComponent,
}));

export const FLUENT_ICON_NAMES: string[] = fluentIconEntries.map(
	([name]) => name,
);

export function getFluentIconComponent(
	iconName?: string,
): FluentIconComponent | null {
	if (!iconName) return null;
	return iconByName.get(iconName) ?? null;
}
