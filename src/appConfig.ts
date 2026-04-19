import appConfigDevData from "./app.config.dev.json";
import appConfigProdData from "./app.config.prod.json";

export interface IConfig {
	api: {
		baseUrl: string;
	};
	agentConfig: {
		url: string;
	};
	auth?: {
		email: string;
		password: string;
	};
}

export class AppConfig {
	private static config?: IConfig;
	private constructor() {}

	public static getConfig(): IConfig | undefined {
		if (!this.config) {
			const appConfig = this.loadConfig();
			if (!appConfig) {
				console.error("Failed to load configuration");
				return;
			}
			this.config = appConfig;
		}
		return this.config;
	}

	private static loadConfig(): IConfig | undefined {
		const runtimeConfig = this.getRuntimeConfig() || {};
		const env = runtimeConfig.NODE_ENV || process.env.NODE_ENV;
		console.log("Environment: ", env);

		let configData: IConfig = {} as any;
		if (env === "production") {
			configData = appConfigProdData;
		} else {
			configData = appConfigDevData;
		}

		// Merge build-time process.env with runtime config (runtime wins)
		const buildEnv =
			typeof process !== "undefined" && process.env ? process.env : {};
		const mergedEnv = { ...buildEnv, ...runtimeConfig };
		if (!this.isEnvLoaded(mergedEnv)) {
			console.info(
				"Environment variables not supplied and hence using default config",
			);
			return configData;
		}
		return this.getConfigFromEnv(mergedEnv, configData);
	}

	private static getConfigFromEnv(env: any, configData: IConfig): IConfig {
		return {
			api: {
				baseUrl: env.API_BASE_URL || configData.api.baseUrl,
			},
			agentConfig: {
				url: env.AGUI_URL || configData.agentConfig.url,
			},
			auth: configData.auth,
		};
	}

	private static isEnvLoaded(env: any): boolean {
		// Check if any runtime config value is set
		return !!(env.AGUI_URL || env.API_BASE_URL || env.NODE_ENV);
	}

	private static getRuntimeConfig() {
		return (window as any).__RUNTIME_CONFIG__;
	}
}
