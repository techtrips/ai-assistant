import { AssistantChatNavItem } from "./AIAssistantChat.models";

export interface IAIAssistantChatState {
	activeNavItem: AssistantChatNavItem;
	isSidebarCollapsed: boolean;
	searchQuery: string;
	inputValue: string;
	isDeveloperMode: boolean;
	useRawResponse: boolean;
}

export enum ASSISTANT_CHAT_DISPATCH_ACTIONS {
	SET_ACTIVE_NAV = "SET_ACTIVE_NAV",
	SET_SIDEBAR_COLLAPSED = "SET_SIDEBAR_COLLAPSED",
	SET_SEARCH_QUERY = "SET_SEARCH_QUERY",
	SET_INPUT_VALUE = "SET_INPUT_VALUE",
	SET_DEVELOPER_MODE = "SET_DEVELOPER_MODE",
	SET_USE_RAW_RESPONSE = "SET_USE_RAW_RESPONSE",
}

export type IAIAssistantChatDispatchActions =
	| {
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_ACTIVE_NAV;
			data: AssistantChatNavItem;
	  }
	| {
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_SIDEBAR_COLLAPSED;
			data: boolean;
	  }
	| { type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_SEARCH_QUERY; data: string }
	| { type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_INPUT_VALUE; data: string }
	| { type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_DEVELOPER_MODE; data: boolean }
	| {
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_USE_RAW_RESPONSE;
			data: boolean;
	  };

export interface IAIAssistantChatActions {
	setActiveNav: (navItem: AssistantChatNavItem) => void;
	toggleSidebar: () => void;
	setSearchQuery: (query: string) => void;
	setInputValue: (value: string) => void;
	toggleDeveloperMode: () => void;
	toggleRawResponse: () => void;
}

export class AIAssistantChatActions implements IAIAssistantChatActions {
	private readonly dispatch: React.Dispatch<IAIAssistantChatDispatchActions>;
	private readonly state: IAIAssistantChatState;

	constructor(
		dispatch: React.Dispatch<IAIAssistantChatDispatchActions>,
		state: IAIAssistantChatState,
	) {
		this.dispatch = dispatch;
		this.state = state;
	}

	public setActiveNav = (navItem: AssistantChatNavItem) => {
		this.dispatch({
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_ACTIVE_NAV,
			data: navItem,
		});
	};

	public toggleSidebar = () => {
		this.dispatch({
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_SIDEBAR_COLLAPSED,
			data: !this.state.isSidebarCollapsed,
		});
	};

	public setSearchQuery = (query: string) => {
		this.dispatch({
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_SEARCH_QUERY,
			data: query,
		});
	};

	public setInputValue = (value: string) => {
		this.dispatch({
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_INPUT_VALUE,
			data: value,
		});
	};

	public toggleDeveloperMode = () => {
		this.dispatch({
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_DEVELOPER_MODE,
			data: !this.state.isDeveloperMode,
		});
	};

	public toggleRawResponse = () => {
		this.dispatch({
			type: ASSISTANT_CHAT_DISPATCH_ACTIONS.SET_USE_RAW_RESPONSE,
			data: !this.state.useRawResponse,
		});
	};
}
