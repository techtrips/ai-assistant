export interface IAIAssistantAgent {
	id?: string;
	name: string;
	description?: string;
	selected?: boolean;
}

export const HOME_ASSISTANT_AGENTS: IAIAssistantAgent[] = [
	{
		name: "TechTrips",
		description: "TechTrips Agent",
	}	
];
