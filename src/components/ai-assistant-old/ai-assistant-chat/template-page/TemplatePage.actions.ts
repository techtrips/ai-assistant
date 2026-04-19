import { ITemplatePageService } from "../../AIAssistant.services";
import type {
	IAIAssistantTemplate,
	IEntity,
	ITemplatePageState,
} from "./TemplatePage.models";

export enum TEMPLATE_PAGE_DISPATCH_ACTIONS {
	SET_TEMPLATES = "SET_TEMPLATES",
	SET_FORM_PANEL_TARGET = "SET_FORM_PANEL_TARGET",
	SET_DESIGN_PANEL_TARGET = "SET_DESIGN_PANEL_TARGET",
	SET_DELETE_TARGET = "SET_DELETE_TARGET",
	SET_DELETE_ERROR = "SET_DELETE_ERROR",
	SET_IS_DELETING = "SET_IS_DELETING",
	SET_IS_PANEL_LOADING = "SET_IS_PANEL_LOADING",
	SET_PANEL_ERROR = "SET_PANEL_ERROR",
	SET_SEARCH_QUERY = "SET_SEARCH_QUERY",
}

export type ITemplatePageDispatchActions =
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES;
			data: IEntity<IAIAssistantTemplate[]>;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_FORM_PANEL_TARGET;
			data: IAIAssistantTemplate | null | undefined;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DESIGN_PANEL_TARGET;
			data: IAIAssistantTemplate | null;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET;
			data: IAIAssistantTemplate | null;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR;
			data: string;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING;
			data: boolean;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_PANEL_LOADING;
			data: boolean;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR;
			data: string;
	  }
	| {
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_SEARCH_QUERY;
			data: string;
	  };

export interface ITemplatePageActions {
	initialize: () => Promise<void>;
	createTemplate: (
		template: IAIAssistantTemplate,
	) => Promise<IAIAssistantTemplate | undefined>;
	updateTemplate: (
		template: IAIAssistantTemplate,
	) => Promise<IAIAssistantTemplate | undefined>;
	deleteTemplate: (template: IAIAssistantTemplate) => Promise<void>;
	openFormPanel: (target: IAIAssistantTemplate | null) => Promise<void>;
	closeFormPanel: () => void;
	openDesignPanel: (template: IAIAssistantTemplate) => Promise<void>;
	closeDesignPanel: () => void;
	openDeleteDialog: (template: IAIAssistantTemplate) => void;
	closeDeleteDialog: () => void;
	confirmDelete: () => Promise<void>;
	setSearchQuery: (query: string) => void;
	saveTemplate: (template: IAIAssistantTemplate) => Promise<void>;
}

export class TemplatePageActions implements ITemplatePageActions {
	private readonly dispatch: React.Dispatch<ITemplatePageDispatchActions>;
	private readonly getState: () => ITemplatePageState;
	private readonly service: ITemplatePageService;

	constructor(
		dispatch: React.Dispatch<ITemplatePageDispatchActions>,
		getState: () => ITemplatePageState,
		service: ITemplatePageService,
	) {
		this.dispatch = dispatch;
		this.getState = getState;
		this.service = service;
	}

	private setTemplates(entity: IEntity<IAIAssistantTemplate[]>) {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
			data: entity,
		});
	}

	public initialize = async () => {
		const state = this.getState();

		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
			data: { data: state.templates.data, loading: true },
		});

		try {
			const entity = await this.service.getTemplates();
			this.setTemplates({
				data: entity.data ?? state.templates.data ?? [],
				loading: false,
				error: entity.error,
			});
		} catch (error) {
			console.error("[TemplatePage] Failed to load templates.", error);
			this.setTemplates({
				data: state.templates.data ?? [],
				loading: false,
				error: "Unable to load templates.",
			});
		}
	};

	public fetchTemplateById = async (
		templateId: string,
	): Promise<IAIAssistantTemplate | undefined> => {
		const entity = await this.service.getTemplateById(templateId);
		return entity.data ?? undefined;
	};

	public createTemplate = async (
		template: IAIAssistantTemplate,
	): Promise<IAIAssistantTemplate | undefined> => {
		const currentTemplates = this.getState().templates.data ?? [];

		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
			data: { data: currentTemplates, loading: true },
		});

		const createdEntity = await this.service.addTemplate(template);

		if (!createdEntity.data) {
			const errorMessage = createdEntity.error ?? "Unable to create template.";
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
				data: { data: currentTemplates, loading: false, error: errorMessage },
			});
			throw new Error(errorMessage);
		}

		this.setTemplates({
			data: [
				createdEntity.data,
				...currentTemplates.filter(
					(item) => item.id !== createdEntity.data?.id,
				),
			],
			loading: false,
			error: createdEntity.error,
		});

		return createdEntity.data;
	};

	public updateTemplate = async (
		template: IAIAssistantTemplate,
	): Promise<IAIAssistantTemplate | undefined> => {
		const currentTemplates = this.getState().templates.data ?? [];

		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
			data: { data: currentTemplates, loading: true },
		});

		const updatedEntity = await this.service.updateTemplate(template);

		if (!updatedEntity.data) {
			const errorMessage = updatedEntity.error ?? "Unable to update template.";
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
				data: { data: currentTemplates, loading: false, error: errorMessage },
			});
			throw new Error(errorMessage);
		}

		const updatedTemplate = updatedEntity.data;

		this.setTemplates({
			data: currentTemplates.map((item) =>
				item.id === updatedTemplate.id ? updatedTemplate : item,
			),
			loading: false,
			error: updatedEntity.error,
		});

		return updatedTemplate;
	};

	public deleteTemplate = async (
		templateInput: IAIAssistantTemplate,
	): Promise<void> => {
		const currentTemplates = this.getState().templates.data ?? [];
		const templateId = templateInput.id?.trim() ?? "";

		if (!templateId) {
			throw new Error("Template id is required.");
		}

		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
			data: { data: currentTemplates, loading: true },
		});

		const deleteResult = await this.service.deleteTemplate(templateId);

		if (deleteResult.error) {
			const errorMessage = deleteResult.error;
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_TEMPLATES,
				data: { data: currentTemplates, loading: false, error: errorMessage },
			});
			throw new Error(errorMessage);
		}

		this.setTemplates({
			data: currentTemplates.filter((item) => item.id !== templateId),
			loading: false,
		});
	};

	// --- UI state actions ---

	public openFormPanel = async (
		target: IAIAssistantTemplate | null,
	): Promise<void> => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
			data: "",
		});
		if (target?.id) {
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_FORM_PANEL_TARGET,
				data: target,
			});
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_PANEL_LOADING,
				data: true,
			});
			try {
				const resolved = await this.fetchTemplateById(target.id);
				this.dispatch({
					type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_FORM_PANEL_TARGET,
					data: resolved ?? target,
				});
			} catch {
				this.dispatch({
					type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
					data: "Failed to load template details.",
				});
			} finally {
				this.dispatch({
					type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_PANEL_LOADING,
					data: false,
				});
			}
		} else {
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_FORM_PANEL_TARGET,
				data: target,
			});
		}
	};

	public closeFormPanel = () => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_FORM_PANEL_TARGET,
			data: undefined,
		});
	};

	public openDesignPanel = async (
		template: IAIAssistantTemplate,
	): Promise<void> => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
			data: "",
		});
		if (template.id) {
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DESIGN_PANEL_TARGET,
				data: template,
			});
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_PANEL_LOADING,
				data: true,
			});
			try {
				const resolved = await this.fetchTemplateById(template.id);
				this.dispatch({
					type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DESIGN_PANEL_TARGET,
					data: resolved ?? template,
				});
			} catch {
				this.dispatch({
					type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_PANEL_ERROR,
					data: "Failed to load template details.",
				});
			} finally {
				this.dispatch({
					type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_PANEL_LOADING,
					data: false,
				});
			}
		} else {
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DESIGN_PANEL_TARGET,
				data: template,
			});
		}
	};

	public closeDesignPanel = () => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DESIGN_PANEL_TARGET,
			data: null,
		});
	};

	public openDeleteDialog = (template: IAIAssistantTemplate) => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET,
			data: template,
		});
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
			data: "",
		});
	};

	public closeDeleteDialog = () => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET,
			data: null,
		});
	};

	public confirmDelete = async () => {
		const deleteTarget = this.getState().deleteTarget;
		if (!deleteTarget) return;

		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
			data: "",
		});
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING,
			data: true,
		});

		try {
			await this.deleteTemplate(deleteTarget);
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_TARGET,
				data: null,
			});
		} catch (error) {
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_DELETE_ERROR,
				data:
					error instanceof Error ? error.message : "Failed to delete template.",
			});
		} finally {
			this.dispatch({
				type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_IS_DELETING,
				data: false,
			});
		}
	};

	public setSearchQuery = (query: string) => {
		this.dispatch({
			type: TEMPLATE_PAGE_DISPATCH_ACTIONS.SET_SEARCH_QUERY,
			data: query,
		});
	};

	public saveTemplate = async (
		template: IAIAssistantTemplate,
	): Promise<void> => {
		if (template.id) {
			await this.updateTemplate(template);
		} else {
			await this.createTemplate(template);
		}
	};
}
