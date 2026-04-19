import { HttpAgent } from "@ag-ui/client";
import type { RunAgentInput } from "@ag-ui/core";

/**
 * Extended HttpAgent that injects `model` into the POST body
 * so the orchestrator knows which deployment to use.
 */
export class ExtendedHttpAgent extends HttpAgent {
	public model?: string;

	constructor(
		config: ConstructorParameters<typeof HttpAgent>[0],
		model?: string,
	) {
		super(config);
		this.model = model;
	}

	protected override requestInit(input: RunAgentInput): RequestInit {
		const base = super.requestInit(input);
		const body = typeof base.body === "string" ? JSON.parse(base.body) : {};
		if (this.model) {
			body.model = this.model;
		}
		return { ...base, body: JSON.stringify(body) };
	}
}
