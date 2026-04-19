import { useEffect, useReducer, useRef } from "react";
import { templateDesignerReducer } from "./TemplateDesigner.reducers";
import {
	TemplateDesignerActions,
	ITemplateDesignerActions,
} from "./TemplateDesigner.actions";
import { ITemplateDesignerState } from "./TemplateDesigner.models";
import {
	ITemplateDesignerProps,
	TemplateDesignerMode,
} from "./TemplateDesigner.models";
import {
	extractBindingPaths,
	validateTemplateJson,
} from "./TemplateDesigner.utils";
import type { ITemplate } from "../templates.models";

const parseTemplate = (
	input?: ITemplate | Record<string, unknown> | string,
): ITemplate | undefined => {
	if (!input) return undefined;
	if (typeof input === "string") {
		try {
			const parsed: unknown = JSON.parse(input);
			const error = validateTemplateJson(parsed);
			if (error) return undefined;
			return parsed as ITemplate;
		} catch {
			return undefined;
		}
	}
	// Object — validate shape before treating as ITemplate
	const error = validateTemplateJson(input);
	if (error) return undefined;
	return input as ITemplate;
};

const initialState: ITemplateDesignerState = {
	template: { loading: true },
	mode: TemplateDesignerMode.Design,
	selectedElement: undefined,
	isDirty: false,
	bindingPaths: [],
	bindingData: {},
};

const getInitialState = (isReadOnly?: boolean): ITemplateDesignerState => ({
	...initialState,
	mode: isReadOnly ? TemplateDesignerMode.Preview : TemplateDesignerMode.Design,
});

export const useInit = (
	props: ITemplateDesignerProps,
): {
	state: ITemplateDesignerState;
	actions: ITemplateDesignerActions;
} => {
	const [state, dispatch] = useReducer(
		templateDesignerReducer,
		getInitialState(props.isReadOnly),
	);
	const stateRef = useRef(state);
	const actionsRef = useRef<TemplateDesignerActions | undefined>(undefined);

	stateRef.current = state;

	if (!actionsRef.current) {
		actionsRef.current = new TemplateDesignerActions(
			dispatch,
			() => stateRef.current,
			props,
		);
	}

	actionsRef.current.updateProps(props);
	const actions = actionsRef.current;

	useEffect(() => {
		const parsed = parseTemplate(props.template);
		const parseError =
			props.template && !parsed
				? "Invalid template: the provided template could not be parsed."
				: undefined;
		actions.initialize(parsed, parseError);
	}, []);

	// Seed data source from props (can be overridden by file upload)
	useEffect(() => {
		let data: Record<string, unknown> | undefined;
		if (typeof props.dataSource === "string") {
			try {
				const parsed = JSON.parse(props.dataSource);
				if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
					data = parsed as Record<string, unknown>;
				}
			} catch {
				// invalid JSON — ignore
			}
		} else if (props.dataSource) {
			data = props.dataSource;
		}
		if (data && Object.keys(data).length > 0) {
			const paths = extractBindingPaths(data);
			actions.setBindingPaths(paths);
			actions.setBindingData(data);
		}
	}, [props.dataSource]);

	return { state, actions };
};
