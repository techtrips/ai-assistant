import { useEffect, useReducer, useRef } from "react";
import { aiAssistantReducer } from "./AIAssistant.reducers";
import { AIAssistantActions, IAIAssistantActions } from "./AIAssistant.actions";
import { IAIAssistantProps, IAIAssistantState } from "./AIAssistant.models";
import {
	AIAssistantService,
	IAIAssistantService,
} from "./AIAssistant.services";

const initialState: IAIAssistantState = {
	starterPrompts: { loading: true },
	templates: { loading: true },
	conversationHistory: { loading: true },
	models: { loading: true },
	activeConversationMessages: { data: [], loading: false },
	activeConversation: undefined,
	selectedModel: undefined,
	isAguiInProgress: false,
	aguiRawData: "",
};

export const useInit = (
	props: IAIAssistantProps,
): {
	state: IAIAssistantState;
	actions: IAIAssistantActions;
	service: IAIAssistantService;
} => {
	const [state, dispatch] = useReducer(aiAssistantReducer, initialState);
	const stateRef = useRef(state);
	const serviceRef = useRef<IAIAssistantService | undefined>(undefined);
	const actionsRef = useRef<AIAssistantActions | undefined>(undefined);

	stateRef.current = state;

	if (!serviceRef.current) {
		serviceRef.current =
			props.service ??
			new AIAssistantService(props.config!, props.getToken, props.agents);
	}

	if (!actionsRef.current) {
		actionsRef.current = new AIAssistantActions(
			dispatch,
			() => stateRef.current,
			serviceRef.current,
			props,
		);
	}

	actionsRef.current.updateProps(props);
	const actions = actionsRef.current;

	useEffect(() => {
		void actions.initialize();
	}, []);

	return { state, actions, service: serviceRef.current };
};
