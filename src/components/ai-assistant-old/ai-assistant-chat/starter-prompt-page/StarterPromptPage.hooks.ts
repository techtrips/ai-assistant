import { useEffect, useReducer, useRef } from "react";
import { starterPromptPageReducer } from "./StarterPromptPage.reducers";
import {
	StarterPromptPageActions,
	type IStarterPromptPageActions,
} from "./StarterPromptPage.actions";
import type {
	IStarterPromptPageProps,
	IStarterPromptPageState,
} from "./StarterPromptPage.models";
import { IStarterPromptPageService } from "../../AIAssistant.services";

const initialState: IStarterPromptPageState = {
	prompts: { loading: true },
	panelTarget: null,
	deleteTarget: null,
	deleteError: "",
	isDeleting: false,
	isSaving: false,
	panelError: "",
	searchQuery: "",
};

export const useStarterPromptPage = (
	props: IStarterPromptPageProps,
	service: IStarterPromptPageService,
): {
	state: IStarterPromptPageState;
	actions: IStarterPromptPageActions;
} => {
	const hasInitialData = !!(
		props.initialData?.data && props.initialData.data.length > 0
	);
	const [state, dispatch] = useReducer(starterPromptPageReducer, {
		...initialState,
		prompts: hasInitialData
			? { data: props.initialData!.data, loading: false }
			: initialState.prompts,
	});
	const stateRef = useRef(state);
	const actionsRef = useRef<StarterPromptPageActions | undefined>(undefined);

	stateRef.current = state;

	if (!actionsRef.current) {
		actionsRef.current = new StarterPromptPageActions(
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
