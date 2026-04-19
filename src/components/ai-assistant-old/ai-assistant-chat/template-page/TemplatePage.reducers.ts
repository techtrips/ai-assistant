import {
	TEMPLATE_PAGE_DISPATCH_ACTIONS,
	type ITemplatePageDispatchActions,
} from "./TemplatePage.actions";
import type { ITemplatePageState } from "./TemplatePage.models";

export const templatePageReducer = (
	state: ITemplatePageState,
	action: ITemplatePageDispatchActions,
): ITemplatePageState => {
	switch (action.type) {
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES: {
			return { ...state, templates: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_FORM_PANEL_TARGET: {
			return { ...state, formPanelTarget: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DESIGN_PANEL_TARGET: {
			return { ...state, designPanelTarget: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET: {
			return { ...state, deleteTarget: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR: {
			return { ...state, deleteError: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING: {
			return { ...state, isDeleting: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_PANEL_LOADING: {
			return { ...state, isPanelLoading: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR: {
			return { ...state, panelError: action.data };
		}
		case TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_SEARCH_QUERY: {
			return { ...state, searchQuery: action.data };
		}
		default: {
			throw new Error("Unhandled action type");
		}
	}
};
