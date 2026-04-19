import { useEffect, useReducer, useRef } from "react";
import { templatePageReducer } from "./TemplatePage.reducers";
import {
	TemplatePageActions,
	type ITemplatePageActions,
} from "./TemplatePage.actions";
import type {
	ITemplatePageProps,
	ITemplatePageState,
} from "./TemplatePage.models";
import { ITemplatePageService } from "../../AIAssistant.services";

const initialState: ITemplatePageState = {
	templates: { loading: true },
	formPanelTarget: undefined,
	designPanelTarget: null,
	deleteTarget: null,
	deleteError: "",
	isDeleting: false,
	isPanelLoading: false,
	panelError: "",
	searchQuery: "",
};

export const useTemplatePage = (
	props: ITemplatePageProps,
	service: ITemplatePageService,
): {
	state: ITemplatePageState;
	actions: ITemplatePageActions;
} => {
	const hasInitialData = !!(
		props.initialData?.data && props.initialData.data.length > 0
	);
	const [state, dispatch] = useReducer(templatePageReducer, {
		...initialState,
		templates: hasInitialData
			? { data: props.initialData!.data, loading: false }
			: initialState.templates,
	});
	const stateRef = useRef(state);
	const actionsRef = useRef<TemplatePageActions | undefined>(undefined);

	stateRef.current = state;

	if (!actionsRef.current) {
		actionsRef.current = new TemplatePageActions(
			dispatch,
			() => stateRef.current,
			service,
		);
	}

	const actions = actionsRef.current;

	useEffect(() => {
		if (!hasInitialData) {
			void actions.initialize();
		}
	}, []);

	return { state, actions };
};
