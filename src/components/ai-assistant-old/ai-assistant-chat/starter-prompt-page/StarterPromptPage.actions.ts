import { IStarterPromptPageService } from "../../AIAssistant.services";
import type {
	IAIAssistantStarterPrompt,
	IEntity,
	IStarterPromptPageState,
} from "./StarterPromptPage.models";

export enum STARTER_PROMPT_PAGE_DISPATCH_ACTIONS {
	SET_PROMPTS = "SET_PROMPTS",
	SET_PANEL_TARGET = "SET_PANEL_TARGET",
	SET_DELETE_TARGET = "SET_DELETE_TARGET",
	SET_DELETE_ERROR = "SET_DELETE_ERROR",
	SET_IS_DELETING = "SET_IS_DELETING",
	SET_IS_SAVING = "SET_IS_SAVING",
	SET_PANEL_ERROR = "SET_PANEL_ERROR",
	SET_SEARCH_QUERY = "SET_SEARCH_QUERY",
}

export type IStarterPromptPageDispatchActions =
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PROMPTS;
			data: IEntity<IAIAssistantStarterPrompt[]>;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_TARGET;
			data: IAIAssistantStarterPrompt | null | undefined;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET;
			data: IAIAssistantStarterPrompt | null;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR;
			data: string;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING;
			data: boolean;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_SAVING;
			data: boolean;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR;
			data: string;
	  }
	| {
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_SEARCH_QUERY;
			data: string;
	  };

export interface IStarterPromptPageActions {
	initialize: () => Promise<void>;
	openCreatePanel: () => void;
	openEditPanel: (prompt: IAIAssistantStarterPrompt) => void;
	closePanel: () => void;
	openDeleteDialog: (prompt: IAIAssistantStarterPrompt) => void;
	closeDeleteDialog: () => void;
	confirmDelete: () => Promise<void>;
	savePrompt: (prompt: IAIAssistantStarterPrompt) => Promise<void>;
	setSearchQuery: (query: string) => void;
}

export class StarterPromptPageActions implements IStarterPromptPageActions {
	private readonly dispatch: React.Dispatch<IStarterPromptPageDispatchActions>;
	private readonly getState: () => IStarterPromptPageState;
	private readonly service: IStarterPromptPageService;

	constructor(
		dispatch: React.Dispatch<IStarterPromptPageDispatchActions>,
		getState: () => IStarterPromptPageState,
		service: IStarterPromptPageService,
	) {
		this.dispatch = dispatch;
		this.getState = getState;
		this.service = service;
	}

	private setPrompts(entity: IEntity<IAIAssistantStarterPrompt[]>) {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PROMPTS,
			data: entity,
		});
	}

	public initialize = async () => {
		const state = this.getState();

		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PROMPTS,
			data: { data: state.prompts.data, loading: true },
		});

		try {
			const entity = await this.service.getStarterPrompts();
			this.setPrompts({
				data: entity.data ?? state.prompts.data ?? [],
				loading: false,
				error: entity.error,
			});
		} catch (error) {
			console.error("[StarterPromptPage] Failed to load prompts.", error);
			this.setPrompts({
				data: state.prompts.data ?? [],
				loading: false,
				error: "Unable to load starter prompts.",
			});
		}
	};

	public savePrompt = async (
		prompt: IAIAssistantStarterPrompt,
	): Promise<void> => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_SAVING,
			data: true,
		});

		const currentPrompts = this.getState().prompts.data ?? [];
		const isEdit = Boolean(prompt.id);

		try {
			if (isEdit) {
				const updatedEntity = await this.service.updateStarterPrompt(prompt);

				if (!updatedEntity.data) {
					throw new Error(
						updatedEntity.error ?? "Unable to update starter prompt.",
					);
				}

				const updatedPrompt = updatedEntity.data;
				this.setPrompts({
					data: currentPrompts.map((item) =>
						item.id === updatedPrompt.id ? updatedPrompt : item,
					),
					loading: false,
				});
			} else {
				const createdEntity = await this.service.addStarterPrompt(prompt);

				if (!createdEntity.data) {
					throw new Error(
						createdEntity.error ?? "Unable to create starter prompt.",
					);
				}

				this.setPrompts({
					data: [
						createdEntity.data,
						...currentPrompts.filter(
							(item) => item.id !== createdEntity.data?.id,
						),
					],
					loading: false,
				});
			}

			this.dispatch({
				type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_TARGET,
				data: null,
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to save starter prompt.";
			this.dispatch({
				type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
				data: message,
			});
		} finally {
			this.dispatch({
				type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_SAVING,
				data: false,
			});
		}
	};

	// --- UI state actions ---

	public openCreatePanel = () => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
			data: "",
		});
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_TARGET,
			data: undefined,
		});
	};

	public openEditPanel = (prompt: IAIAssistantStarterPrompt) => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
			data: "",
		});
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_TARGET,
			data: prompt,
		});
	};

	public closePanel = () => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_PANEL_TARGET,
			data: null,
		});
	};

	public openDeleteDialog = (prompt: IAIAssistantStarterPrompt) => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
			data: "",
		});
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET,
			data: prompt,
		});
	};

	public closeDeleteDialog = () => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
			data: "",
		});
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET,
			data: null,
		});
	};

	public confirmDelete = async () => {
		const deleteTarget = this.getState().deleteTarget;

		if (!deleteTarget?.id) {
			return;
		}

		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
			data: "",
		});
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING,
			data: true,
		});

		try {
			const deleteResult = await this.service.deleteStarterPrompt(
				deleteTarget.id,
				deleteTarget.agentName,
			);

			if (deleteResult.error) {
				throw new Error(deleteResult.error);
			}

			const currentPrompts = this.getState().prompts.data ?? [];
			this.setPrompts({
				data: currentPrompts.filter((item) => item.id !== deleteTarget.id),
				loading: false,
			});
			this.dispatch({
				type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET,
				data: null,
			});
		} catch (error) {
			this.dispatch({
				type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
				data:
					error instanceof Error
						? error.message
						: "Unable to delete starter prompt.",
			});
		} finally {
			this.dispatch({
				type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING,
				data: false,
			});
		}
	};

	public setSearchQuery = (query: string) => {
		this.dispatch({
			type: STARTER_PROMPT_PAGE_DISPATCH_ACTIONS.SET_SEARCH_QUERY,
			data: query,
		});
	};
}
