import { useCallback, useMemo, useState } from "react";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { SparkleRegular } from "@fluentui/react-icons";
import { homeStyles } from "./Home.styles";
import {
	AIAssistant,
	agUiAdapter,
	ConversationHistory,
	StarterPrompts,
	TemplateRenderer,
	AIAssistantService,
} from "../../../ai-assistant";
import { HOME_ASSISTANT_AGENTS } from "./Home.models";
import { AppConfig } from "../../../../appConfig";
import { useAuth } from "./useAuth";

const useStyles = makeStyles(homeStyles);

const appConfig = AppConfig.getConfig();
const aguiUrl = appConfig?.agentConfig.url ?? "";
const apiBaseUrl = appConfig?.api.baseUrl ?? "";

export const Home = () => {
	const classes = useStyles();
	const [isAssistantVisible, setIsAssistantVisible] = useState(true);

	const { loginError, getAccessToken } = useAuth({
		apiBaseUrl,
		email: appConfig?.auth?.email,
		password: appConfig?.auth?.password,
	});

	const adapter = useMemo(
		() => agUiAdapter({ url: aguiUrl, getToken: getAccessToken }),
		[getAccessToken],
	);

	const assistantService = useMemo(
		() =>
			new AIAssistantService({
				baseUrl: apiBaseUrl,
				getToken: getAccessToken,
			}),
		[getAccessToken],
	);

	const extensions = useMemo(
		() => [ConversationHistory, StarterPrompts, TemplateRenderer],
		[],
	);

	const handleToggleAssistant = useCallback(() => {
		setIsAssistantVisible((isVisible) => !isVisible);
	}, []);

	return (
		<div className={classes.root}>
			<div className={classes.navBar}>
				<h1 className={classes.navBarTitle}>Home</h1>
				<button
					className={mergeClasses(
						classes.assistantToggleButton,
						isAssistantVisible && classes.assistantToggleButtonActive,
					)}
					type="button"
					title={isAssistantVisible ? "Hide AI assistant" : "Open AI assistant"}
					aria-label={
						isAssistantVisible ? "Hide AI assistant" : "Open AI assistant"
					}
					onClick={handleToggleAssistant}
				>
					<SparkleRegular fontSize={18} />
				</button>
			</div>
			<div className={classes.content}>
				{loginError ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							flex: 1,
							color: "#c4314b",
							fontSize: "0.9rem",
							padding: "24px",
							textAlign: "center",
						}}
					>
						{loginError}
					</div>
				) : (
					<>
						<div className={classes.mainArea} />
						<div
							className={mergeClasses(
								classes.assistantContainer,
								!isAssistantVisible && classes.assistantContainerHidden,
							)}
						>
							<AIAssistant
								adapter={adapter}
								extensions={extensions}
								service={assistantService}
								agents={HOME_ASSISTANT_AGENTS}
								onClose={handleToggleAssistant}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
