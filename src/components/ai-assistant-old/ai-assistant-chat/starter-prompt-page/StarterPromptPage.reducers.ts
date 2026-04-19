import {
	STARTER_PROMPT_PAGE_DISPATCH_ACTIONS,
	type IStarterPromptPageDispatchActions,
} from "./StarterPromptPage.actions";
import type { IStarterPromptPageState } from "./StarterPromptPage.models";

export const starterPromptPageReducer = (
	state: IStarterPromptPageState,
	action: IStarterPromptPageDispatchActions,
): IStarterPromptPageState => {
	switch (action.type) {
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PROMPTS: {
			return { ...state, prompts: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_TARGET: {
			return { ...state, panelTarget: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET: {
			return { ...state, deleteTarget: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR: {
			return { ...state, deleteError: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING: {
			return { ...state, isDeleting: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_SAVING: {
			return { ...state, isSaving: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR: {
			return { ...state, panelError: action.data };
		}
		case STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_SEARCH_QUERY: {
			return { ...state, searchQuery: action.data };
		}
		default: {
			throw new Error("Unhandled action type");
		}
	}
};
