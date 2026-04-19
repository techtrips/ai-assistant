import {
	Dropdown,
	Input,
	Option,
	Skeleton,
	SkeletonItem,
	Textarea,
	mergeClasses,
} from "@fluentui/react-components";
import {
	Bot20Regular,
	Chat20Regular,
	Dismiss12Regular,
	LightbulbRegular,
	Tag20Regular,
	TextDescription20Regular,
} from "@fluentui/react-icons";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type {
	IAIAssistantStarterPrompt,
	IStarterPromptFormProps,
	IStarterPromptFormState,
} from "./StarterPromptForm.models";
import { useStarterPromptFormStyles } from "./StarterPromptForm.styles";
import { SlidePanel } from "../../../../common/slide-panel";
import {
	createInitialFormState,
	extractParameters,
	getParameterSuggestionContext,
	getPromptPreview,
	getTextAreaCaretCoordinates,
	includesValue,
	type IParameterSuggestionContext,
	type IParameterSuggestionPosition,
	mergeUniqueParameters,
	normalizeParameterName,
	normalizeStringList,
	PARAMETER_SUGGESTION_MAX_HEIGHT,
	PARAMETER_SUGGESTION_WIDTH,
	removeParameterPlaceholders,
} from "../StarterPromptPage.utils";

export const StarterPromptForm = (props: IStarterPromptFormProps) => {
	const {
		prompt,
		isSidebar = false,
		loading = false,
		agents,
		panelError,
		onSave,
		onClose,
	} = props;

	const classes = useStarterPromptFormStyles();
	const promptEditorRef = useRef<HTMLDivElement>(null);

	const mergedStyles = useMemo(() => {
		const merge = (key: keyof typeof classes) =>
			mergeClasses(
				classes[key],
				isSidebar && classes[`${key}Sidebar` as keyof typeof classes],
			);

		return {
			formField: merge("formField"),
			formFieldHeader: merge("formFieldHeader"),
			formFieldContent: merge("formFieldContent"),
			fieldIcon: merge("fieldIcon"),
			fieldTitle: merge("fieldTitle"),
		};
	}, [classes, isSidebar]);

	const [form, setForm] = useState<IStarterPromptFormState>(
		createInitialFormState(),
	);
	const [formError, setFormError] = useState("");
	const [parameterInputValue, setParameterInputValue] = useState("");
	const [parameterSuggestionContext, setParameterSuggestionContext] =
		useState<IParameterSuggestionContext | null>(null);
	const [parameterSuggestionPosition, setParameterSuggestionPosition] =
		useState<IParameterSuggestionPosition | null>(null);
	const [
		selectedParameterSuggestionIndex,
		setSelectedParameterSuggestionIndex,
	] = useState(0);
	const [tagInputValue, setTagInputValue] = useState("");

	const isFormValid =
		form.title.trim().length > 0 &&
		form.prompt.trim().length > 0 &&
		form.agentName.trim().length > 0;

	/* ── Parameter suggestions ───────────────────────────────────────── */

	const closeParameterSuggestions = useCallback(() => {
		setParameterSuggestionContext(null);
		setParameterSuggestionPosition(null);
		setSelectedParameterSuggestionIndex(0);
	}, []);

	const calculateParameterSuggestionPosition = useCallback(
		(
			textArea: HTMLTextAreaElement,
			cursorPosition: number,
		): IParameterSuggestionPosition => {
			const promptEditor = promptEditorRef.current;

			if (!promptEditor) {
				return { top: 8, left: 8 };
			}

			const caret = getTextAreaCaretCoordinates(textArea, cursorPosition);
			const textAreaRect = textArea.getBoundingClientRect();
			const editorRect = promptEditor.getBoundingClientRect();

			const textAreaTop = textAreaRect.top - editorRect.top;
			const textAreaLeft = textAreaRect.left - editorRect.left;
			const textAreaBottom = textAreaTop + textArea.clientHeight;

			const preferredTop =
				textAreaTop + caret.top - textArea.scrollTop + caret.lineHeight + 4;
			const preferredLeft = textAreaLeft + caret.left - textArea.scrollLeft;

			const minTop = textAreaTop + 4;
			const maxTop = Math.max(
				minTop,
				textAreaBottom - PARAMETER_SUGGESTION_MAX_HEIGHT - 4,
			);
			const minLeft = textAreaLeft + 4;
			const maxLeft = Math.max(
				minLeft,
				textAreaLeft + textArea.clientWidth - PARAMETER_SUGGESTION_WIDTH - 4,
			);

			return {
				top: Math.min(Math.max(preferredTop, minTop), maxTop),
				left: Math.min(Math.max(preferredLeft, minLeft), maxLeft),
			};
		},
		[],
	);

	const syncParameterSuggestions = useCallback(
		(promptValue: string, textArea: HTMLTextAreaElement | null) => {
			const caretPosition = textArea?.selectionStart;

			if (!textArea || caretPosition == null || form.parameters.length === 0) {
				closeParameterSuggestions();
				return;
			}

			const nextContext = getParameterSuggestionContext(
				promptValue,
				caretPosition,
			);

			if (!nextContext) {
				closeParameterSuggestions();
				return;
			}

			setParameterSuggestionContext(nextContext);
			setParameterSuggestionPosition(
				calculateParameterSuggestionPosition(textArea, caretPosition),
			);
		},
		[
			calculateParameterSuggestionPosition,
			closeParameterSuggestions,
			form.parameters.length,
		],
	);

	const parameterSuggestions = useMemo(() => {
		if (!parameterSuggestionContext) {
			return [];
		}

		const query = parameterSuggestionContext.query.toLowerCase();

		return form.parameters.filter((parameter) =>
			query ? parameter.toLowerCase().includes(query) : true,
		);
	}, [form.parameters, parameterSuggestionContext]);

	useEffect(() => {
		setSelectedParameterSuggestionIndex(0);
	}, [
		parameterSuggestionContext?.query,
		parameterSuggestionContext?.triggerStart,
		parameterSuggestions.length,
	]);

	/* ── Form lifecycle ──────────────────────────────────────────────── */

	const resetForm = useCallback(() => {
		setForm(createInitialFormState(agents[0] ?? ""));
		setFormError("");
		setParameterInputValue("");
		setTagInputValue("");
		closeParameterSuggestions();
	}, [agents, closeParameterSuggestions]);

	const closePanel = useCallback(() => {
		if (loading) return;
		onClose();
		resetForm();
	}, [loading, onClose, resetForm]);

	useEffect(() => {
		if (prompt) {
			const promptText = getPromptPreview(
				prompt.prompt ?? "",
				prompt.description,
			);
			const nextParameters = [...normalizeStringList(prompt.parameters)];

			extractParameters(promptText).forEach((parameter) => {
				if (!includesValue(nextParameters, parameter)) {
					nextParameters.push(parameter);
				}
			});

			setForm({
				agentName: prompt.agentName?.trim() ?? agents[0] ?? "",
				parameters: nextParameters,
				prompt: promptText,
				tags: normalizeStringList(prompt.tags),
				title: prompt.title,
			});
			setFormError("");
			setParameterInputValue("");
			setTagInputValue("");
			closeParameterSuggestions();
		} else {
			resetForm();
		}

		const frame = window.requestAnimationFrame(() => {
			document.getElementById("starter-prompt-title")?.focus();
		});

		return () => window.cancelAnimationFrame(frame);
	}, [prompt]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				closePanel();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [closePanel]);

	/* ── Field updates ───────────────────────────────────────────────── */

	const updateFormField = useCallback(
		(field: keyof IStarterPromptFormState, value: string) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const updatePromptAndAutoAddParameters = useCallback((promptText: string) => {
		setForm((prev) => {
			const detectedParameters = extractParameters(promptText);
			const mergedParameters = mergeUniqueParameters(
				prev.parameters,
				detectedParameters,
			);

			if (prev.prompt === promptText && mergedParameters === prev.parameters) {
				return prev;
			}

			return { ...prev, parameters: mergedParameters, prompt: promptText };
		});
	}, []);

	const setPromptCursorPosition = useCallback((cursorPosition: number) => {
		requestAnimationFrame(() => {
			const textarea = document.getElementById(
				"starter-prompt-textarea",
			) as HTMLTextAreaElement | null;

			if (textarea) {
				textarea.focus();
				textarea.setSelectionRange(cursorPosition, cursorPosition);
			}
		});
	}, []);

	const insertParameterIntoPrompt = useCallback(
		(parameter: string) => {
			if (!parameterSuggestionContext) return;

			const placeholder = `{${parameter}}`;
			const trailingBraceLength =
				form.prompt[parameterSuggestionContext.cursor] === "}" ? 1 : 0;
			const nextPrompt =
				form.prompt.slice(0, parameterSuggestionContext.triggerStart) +
				placeholder +
				form.prompt.slice(
					parameterSuggestionContext.cursor + trailingBraceLength,
				);

			updateFormField("prompt", nextPrompt);
			closeParameterSuggestions();
			setPromptCursorPosition(
				parameterSuggestionContext.triggerStart + placeholder.length,
			);
		},
		[
			closeParameterSuggestions,
			form.prompt,
			parameterSuggestionContext,
			setPromptCursorPosition,
			updateFormField,
		],
	);

	/* ── Keyboard handlers ───────────────────────────────────────────── */

	const handlePromptKeyDown = useCallback(
		(event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === "Escape" && parameterSuggestionContext) {
				event.preventDefault();
				closeParameterSuggestions();
				return;
			}

			if (!parameterSuggestionContext || parameterSuggestions.length === 0) {
				return;
			}

			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedParameterSuggestionIndex((prev) =>
					prev < parameterSuggestions.length - 1 ? prev + 1 : 0,
				);
				return;
			}

			if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedParameterSuggestionIndex((prev) =>
					prev > 0 ? prev - 1 : parameterSuggestions.length - 1,
				);
				return;
			}

			if (event.key === "Enter" || event.key === "Tab") {
				const selected =
					parameterSuggestions[selectedParameterSuggestionIndex] ??
					parameterSuggestions[0];

				if (selected) {
					event.preventDefault();
					insertParameterIntoPrompt(selected);
				}
			}
		},
		[
			closeParameterSuggestions,
			insertParameterIntoPrompt,
			parameterSuggestionContext,
			parameterSuggestions,
			selectedParameterSuggestionIndex,
		],
	);

	const handlePromptCursorActivity = useCallback(
		(event: React.SyntheticEvent<HTMLTextAreaElement>) => {
			syncParameterSuggestions(
				form.prompt,
				event.target as HTMLTextAreaElement | null,
			);
		},
		[form.prompt, syncParameterSuggestions],
	);

	/* ── Parameters ──────────────────────────────────────────────────── */

	const handleAddParameter = useCallback(() => {
		const parameter = normalizeParameterName(parameterInputValue);
		if (!parameter) return;

		setForm((prev) => {
			if (includesValue(prev.parameters, parameter)) return prev;
			return { ...prev, parameters: [...prev.parameters, parameter] };
		});
		setParameterInputValue("");
	}, [parameterInputValue]);

	const handleRemoveParameter = useCallback((parameter: string) => {
		setForm((prev) => ({
			...prev,
			parameters: prev.parameters.filter(
				(item) => item.toLowerCase() !== parameter.toLowerCase(),
			),
			prompt: removeParameterPlaceholders(prev.prompt, parameter),
		}));
	}, []);

	const handleParameterKeyDown = useCallback(
		(event: ReactKeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleAddParameter();
			}

			if (
				event.key === "Backspace" &&
				parameterInputValue.length === 0 &&
				form.parameters.length > 0
			) {
				const last = form.parameters[form.parameters.length - 1];
				if (last) {
					event.preventDefault();
					handleRemoveParameter(last);
				}
			}
		},
		[
			form.parameters,
			handleAddParameter,
			handleRemoveParameter,
			parameterInputValue,
		],
	);

	/* ── Tags ────────────────────────────────────────────────────────── */

	const handleAddTag = useCallback(() => {
		const nextTag = tagInputValue.trim();
		if (!nextTag) return;

		setForm((prev) => {
			if (includesValue(prev.tags, nextTag)) return prev;
			return { ...prev, tags: [...prev.tags, nextTag] };
		});
		setTagInputValue("");
	}, [tagInputValue]);

	const handleRemoveTag = useCallback((tag: string) => {
		setForm((prev) => ({
			...prev,
			tags: prev.tags.filter(
				(item) => item.toLowerCase() !== tag.toLowerCase(),
			),
		}));
	}, []);

	const handleTagKeyDown = useCallback(
		(event: ReactKeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleAddTag();
			}

			if (
				event.key === "Backspace" &&
				tagInputValue.length === 0 &&
				form.tags.length > 0
			) {
				const last = form.tags[form.tags.length - 1];
				if (last) {
					event.preventDefault();
					handleRemoveTag(last);
				}
			}
		},
		[form.tags, handleAddTag, handleRemoveTag, tagInputValue],
	);

	/* ── Save ────────────────────────────────────────────────────────── */

	const handleSavePrompt = useCallback(async () => {
		if (!isFormValid) return;

		setFormError("");

		const parameters = normalizeStringList([
			...form.parameters,
			...extractParameters(form.prompt),
		]);
		const tags = normalizeStringList(form.tags);
		const nextPrompt: IAIAssistantStarterPrompt = {
			...prompt,
			agentName: form.agentName.trim(),
			description: form.prompt.trim(),
			parameters: parameters.length > 0 ? parameters : null,
			prompt: form.prompt.trim(),
			tags: tags.length > 0 ? tags : null,
			templates:
				prompt?.templates && prompt.templates.length > 0
					? prompt.templates
					: ["placeholder_text"],
			title: form.title.trim(),
		};

		try {
			await onSave(nextPrompt);
			resetForm();
			closeParameterSuggestions();
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Unable to save starter prompt.",
			);
		}
	}, [closeParameterSuggestions, prompt, form, isFormValid, onSave, resetForm]);

	/* ── Render helpers ──────────────────────────────────────────────── */

	const renderLoadingSkeleton = () => (
		<div className={classes.panelShimmerOverlay}>
			<Skeleton animation="pulse" aria-label="Saving starter prompt">
				<div className={classes.shimmerField}>
					<SkeletonItem size={16} style={{ width: "30%" }} />
					<SkeletonItem size={32} style={{ width: "100%" }} />
				</div>
				<div className={classes.shimmerField}>
					<SkeletonItem size={16} style={{ width: "35%" }} />
					<SkeletonItem size={32} style={{ width: "100%" }} />
				</div>
				<div className={classes.shimmerField}>
					<SkeletonItem size={16} style={{ width: "25%" }} />
					<SkeletonItem size={128} style={{ width: "100%" }} />
				</div>
				<div className={classes.shimmerField}>
					<SkeletonItem size={16} style={{ width: "30%" }} />
					<SkeletonItem size={48} style={{ width: "100%" }} />
				</div>
				<div className={classes.shimmerField}>
					<SkeletonItem size={16} style={{ width: "20%" }} />
					<SkeletonItem size={48} style={{ width: "100%" }} />
				</div>
			</Skeleton>
		</div>
	);

	const renderFormField = (
		icon: React.ReactNode,
		title: string,
		description: string,
		content: React.ReactNode,
	) => (
		<div className={mergedStyles.formField}>
			<div className={mergedStyles.formFieldHeader}>
				<div className={mergedStyles.fieldIcon}>{icon}</div>
				<div className={classes.fieldTitleGroup}>
					<div className={mergedStyles.fieldTitle}>{title}</div>
					<div className={classes.fieldDescription}>{description}</div>
				</div>
			</div>
			<div className={mergedStyles.formFieldContent}>{content}</div>
		</div>
	);

	const renderTagsInput = (
		items: string[],
		inputValue: string,
		onInputChange: (value: string) => void,
		onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void,
		onRemove: (item: string) => void,
		placeholder: string,
		labelPrefix: string,
	) => (
		<div className={classes.tagsInput}>
			{items.map((item) => (
				<span key={item} className={classes.tagChip}>
					{item}
					<button
						className={classes.tagRemove}
						type="button"
						aria-label={`Remove ${labelPrefix} ${item}`}
						onClick={() => onRemove(item)}
					>
						<Dismiss12Regular />
					</button>
				</span>
			))}
			<input
				className={classes.tagInlineInput}
				placeholder={items.length === 0 ? placeholder : ""}
				value={inputValue}
				onChange={(event) => onInputChange(event.target.value)}
				onKeyDown={onKeyDown}
			/>
		</div>
	);

	const renderFormFields = () => (
		<>
			{renderFormField(
				<TextDescription20Regular />,
				"Title",
				"Short label displayed on the starter prompt chip",
				<Input
					id="starter-prompt-title"
					className={classes.fieldInput}
					placeholder="Search Credits by Agreement"
					value={form.title}
					onChange={(_, data) => updateFormField("title", data.value)}
				/>,
			)}

			{renderFormField(
				<Bot20Regular />,
				"Agent Name",
				"The agent this prompt is associated with",
				agents.length > 0 ? (
					<Dropdown
						className={classes.fieldInput}
						placeholder="Select an agent"
						selectedOptions={form.agentName ? [form.agentName] : []}
						value={form.agentName}
						onOptionSelect={(_, data) => {
							if (typeof data.optionValue === "string") {
								updateFormField("agentName", data.optionValue);
							}
						}}
					>
						{agents.map((agentName) => (
							<Option key={agentName} text={agentName} value={agentName}>
								{agentName}
							</Option>
						))}
					</Dropdown>
				) : (
					<Input
						className={classes.fieldInput}
						placeholder="Enter an agent name"
						value={form.agentName}
						onChange={(_, data) => updateFormField("agentName", data.value)}
					/>
				),
			)}

			{renderFormField(
				<Chat20Regular />,
				"Prompt",
				"Type { to trigger parameter suggestions",
				<div className={classes.promptEditor} ref={promptEditorRef}>
					<Textarea
						id="starter-prompt-textarea"
						className={classes.promptInput}
						placeholder="Search for credit requests for agreement {agreementId}"
						resize="vertical"
						rows={6}
						value={form.prompt}
						onChange={(event, data) => {
							updatePromptAndAutoAddParameters(data.value);
							syncParameterSuggestions(
								data.value,
								event.target as HTMLTextAreaElement | null,
							);
						}}
						onKeyDown={handlePromptKeyDown}
						onKeyUp={handlePromptCursorActivity}
						onClick={handlePromptCursorActivity}
						onSelect={handlePromptCursorActivity}
						onScroll={handlePromptCursorActivity}
					/>
					{parameterSuggestionContext &&
						parameterSuggestions.length > 0 &&
						parameterSuggestionPosition && (
							<div
								className={classes.promptParameterSuggestions}
								style={{
									top: `${parameterSuggestionPosition.top}px`,
									left: `${parameterSuggestionPosition.left}px`,
								}}
							>
								{parameterSuggestions.map((parameter, index) => (
									<button
										key={parameter}
										type="button"
										className={`${classes.promptParameterSuggestionItem} ${
											selectedParameterSuggestionIndex === index
												? classes.promptParameterSuggestionItemActive
												: ""
										}`}
										onMouseDown={(event) => {
											event.preventDefault();
											insertParameterIntoPrompt(parameter);
										}}
									>
										{parameter}
									</button>
								))}
							</div>
						)}
				</div>,
			)}

			{renderFormField(
				<Tag20Regular />,
				"Parameters",
				"Add parameter tags (press Enter to add)",
				renderTagsInput(
					form.parameters,
					parameterInputValue,
					setParameterInputValue,
					handleParameterKeyDown,
					handleRemoveParameter,
					"Type a parameter and press Enter",
					"parameter",
				),
			)}

			{renderFormField(
				<Tag20Regular />,
				"Tags",
				"Categorize prompts for filtering (press Enter to add)",
				renderTagsInput(
					form.tags,
					tagInputValue,
					setTagInputValue,
					handleTagKeyDown,
					handleRemoveTag,
					"Type a tag and press Enter",
					"tag",
				),
			)}
		</>
	);

	/* ── Render ──────────────────────────────────────────────────────── */

	const displayError = panelError || formError;

	return (
		<SlidePanel
			title={prompt ? "Edit Starter Prompt" : "Add Starter Prompt"}
			icon={<LightbulbRegular />}
			isSidebar={isSidebar}
			buttons={{
				submitLabel: loading ? "Saving..." : "Submit",
				submitDisabled: !isFormValid,
				onSubmit: handleSavePrompt,
				onCancel: closePanel,
			}}
			disabled={loading}
			error={displayError || undefined}
			onClose={closePanel}
		>
			{loading && renderLoadingSkeleton()}
			{renderFormFields()}
		</SlidePanel>
	);
};
