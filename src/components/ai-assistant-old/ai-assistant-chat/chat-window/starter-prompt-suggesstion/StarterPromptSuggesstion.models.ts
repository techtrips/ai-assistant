import { IEntity } from "../../../../../models/common.models";
import { IAIAssistantStarterPrompt } from "../../../AIAssistant.models";

export interface IStarterPromptSuggesstionProps {
	prompts: IEntity<IAIAssistantStarterPrompt[]>;
	onSelectPrompt: (prompt: IAIAssistantStarterPrompt) => void;
}
