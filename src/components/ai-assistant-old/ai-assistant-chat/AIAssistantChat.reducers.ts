import {
	ASSISTANT_CHAT_DISPATCH_ACTIONS,
	IAIAssistantChatDispatchActions,
	IAIAssistantChatState,
} from "./AIAssistantChat.actions";

export const aiAssistantChatReducer = (
	state: IAIAssistantChatState,
	action: IAIAssistantChatDispatchActions,
): IAIAssistantChatState => {
	switch (action.type) {
		case ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_ACTIVE_NAV: {
			return { ...state, activeNavItem: action.data, searchQuery: "" };
		}
		case ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_SIDEBAR_COLLAPSED: {
			return { ...state, isSidebarCollapsed: action.data };
		}
		case ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_SEARCH_QUERY: {
			return { ...state, searchQuery: action.data };
		}
		case ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_INPUT_VALUE: {
			return { ...state, inputValue: action.data };
		}
		case ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_DEVELOPER_MODE: {
			return { ...state, isDeveloperMode: action.data };
		}
		case ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_USE_RAW_RESPONSE: {
			return { ...state, useRawResponse: action.data };
		}
		default: {
			throw new Error("Unhandled action type");
		}
	}
};
