import {
	AI_ASSISTANT_DISPATCH_ACTIONS,
	IAIAssistantDispatchActions,
} from "./AIAssistant.actions";
import { IAIAssistantState } from "./AIAssistant.models";

export const aiAssistantReducer = (
	state: IAIAssistantState,
	action: IAIAssistantDispatchActions,
): IAIAssistantState => {
	switch (action.type) {
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_STARTER_PROMPTS: {
			return { ...state, starterPrompts: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_TEMPLATES: {
			return { ...state, templates: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_CONVERSATION_HISTORY: {
			return { ...state, conversationHistory: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_MODELS: {
			return { ...state, models: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION_MESSAGES: {
			return { ...state, activeConversationMessages: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_SELECTED_MODEL: {
			return { ...state, selectedModel: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_ACTIVE_CONVERSATION: {
			return { ...state, activeConversation: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_IN_PROGRESS: {
			return { ...state, isAguiInProgress: action.data };
		}
		case AI_ASSISTANT_DISPATCH_ACTIONS.SET_AGUI_RAW_DATA: {
			return { ...state, aguiRawData: action.data };
		}
		default: {
			throw new Error("Unhandled action type");
		}
	}
};
