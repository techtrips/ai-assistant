import { Text } from "@fluentui/react-components";
import type { ITemplate } from "../templates.models";
import type { ITemplateComponentProps } from "../templates.models";
import { TemplateCard } from "./control-renderer/TemplateCard";

/**
 * Renders an ITemplate against server data.
 *
 * Receives `ITemplateComponentProps` from the AI Assistant.
 * Expects `data` to contain:
 *   - `template`: the ITemplate JSON (card + bindings)
 *   - `serverData`: the raw data from the server
 *
 * Or alternatively, `data` itself can be the ITemplate with
 * a sibling `serverData` key.
 */
export const TemplateRenderer = (props: ITemplateComponentProps) => {
	const { data: propsData, onAction } = props;

	const template = (propsData?.template ?? propsData) as ITemplate | undefined;
	const data = (propsData?.serverData ?? {}) as Record<string, unknown>;

	if (!template?.card) {
		return <Text>No template data available.</Text>;
	}

	return <TemplateCard {...template.card} data={data} onAction={onAction} />;
};

export default TemplateRenderer;
