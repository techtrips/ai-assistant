import { lazy, Suspense } from "react";
import type {
	ITemplateInfo,
	TemplateComponent,
	ITemplateComponentProps,
} from "./templates.models";
import templateConfig from "./templates.config.json";

const lazyTemplates: Record<string, TemplateComponent> = {};

for (const {
	templateId,
	componentPath,
	exportName,
} of templateConfig.templates) {
	// Strip leading "./" so the template literal has a static prefix —
	// this lets the bundler statically determine the base directory,
	// avoiding the "critical dependency" warning while staying fully dynamic.
	const modulePath = componentPath.replace("./", "");
	const LazyComponent = lazy(() =>
		import(`./${modulePath}`).then((m: any) => ({
			default: m[exportName] as React.ComponentType<ITemplateComponentProps>,
		})),
	);

	const WrappedComponent: TemplateComponent = (
		props: ITemplateComponentProps,
	) => (
		<Suspense fallback={<div>Loading...</div>}>
			<LazyComponent {...props} />
		</Suspense>
	);
	WrappedComponent.displayName = `Lazy(${templateId})`;

	lazyTemplates[templateId] = WrappedComponent;
}

export const getTemplateComponent = (
	template: ITemplateInfo,
): TemplateComponent | undefined => {
	return lazyTemplates[template.templateId];
};
