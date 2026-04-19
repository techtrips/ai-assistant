import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IChatInputProps, IChatInputState } from "./ChatInput.models";

/**
 * Focuses the textarea on mount and whenever the panel becomes visible
 * (handles `display: none` → visible transitions via IntersectionObserver).
 * Also re-focuses when `focusTrigger` changes (e.g. New Chat).
 */
export const useAutoFocus = (
	textareaRef: React.RefObject<HTMLTextAreaElement | null>,
	focusTrigger?: number,
) => {
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.focus();
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [textareaRef]);

	useEffect(() => {
		if (focusTrigger != null && focusTrigger > 0) {
			textareaRef.current?.focus();
		}
	}, [focusTrigger, textareaRef]);
};

/** Core input state: value, selected model, recording flag. */
export const useChatInputState = (
	inputValue: string,
	defaultSelectedModel: string,
) => {
	const [state, setState] = useState<IChatInputState>({
		isRecording: false,
		inputValue,
		selectedModel: defaultSelectedModel,
	});

	useEffect(() => {
		setState((prev) => {
			const updates: Partial<IChatInputState> = {};
			if (defaultSelectedModel !== prev.selectedModel) {
				updates.selectedModel = defaultSelectedModel;
			}
			if (inputValue !== prev.inputValue) {
				updates.inputValue = inputValue;
			}
			return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
		});
	}, [defaultSelectedModel, inputValue]);

	return { state, setState };
};

/** Autocomplete suggestions filtered from starter prompts. */
export const useAutocompleteSuggestions = (
	inputValue: string,
	allPrompts: IChatInputProps["starterPrompts"]["data"],
	onSelectStarterPrompt: IChatInputProps["onSelectStarterPrompt"],
) => {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const prompts = allPrompts ?? [];

	const filtered = useMemo(() => {
		const trimmed = inputValue.trim();
		if (!trimmed) return [];
		const lower = trimmed.toLowerCase();
		return prompts.filter(
			(sp) =>
				sp.title.toLowerCase().includes(lower) ||
				(sp.prompt?.toLowerCase().includes(lower) ?? false),
		);
	}, [prompts, inputValue]);

	useEffect(() => {
		setSelectedIndex(-1);
	}, [filtered.length]);

	const select = useCallback(
		(sp: (typeof prompts)[number]) => {
			setShowSuggestions(false);
			onSelectStarterPrompt(sp);
		},
		[onSelectStarterPrompt],
	);

	return {
		showSuggestions,
		setShowSuggestions,
		selectedIndex,
		setSelectedIndex,
		filtered,
		select,
	};
};

/** Voice input recording handlers. */
export const useVoiceInput = (
	currentInputValue: string,
	setState: React.Dispatch<React.SetStateAction<IChatInputState>>,
	onInputChange: (value: string) => void,
) => {
	const recordingBaseRef = useRef("");

	const handleStart = useCallback(() => {
		recordingBaseRef.current = currentInputValue;
		setState((prev) => ({ ...prev, isRecording: true }));
	}, [currentInputValue, setState]);

	const handleTranscript = useCallback(
		(message: string) => {
			const next = [recordingBaseRef.current, message]
				.filter(Boolean)
				.join(" ")
				.trim();
			setState((prev) => ({ ...prev, inputValue: next }));
			onInputChange(next);
		},
		[onInputChange, setState],
	);

	const handleStop = useCallback(
		(message: string) => {
			setState((prev) => ({ ...prev, isRecording: false }));

			if (message.trim()) {
				const next = [recordingBaseRef.current, message]
					.filter(Boolean)
					.join(" ")
					.trim();
				setState((prev) => ({ ...prev, inputValue: next }));
				onInputChange(next);
				return;
			}

			setState((prev) => ({
				...prev,
				inputValue: recordingBaseRef.current,
			}));
			onInputChange(recordingBaseRef.current);
		},
		[onInputChange, setState],
	);

	return { handleStart, handleTranscript, handleStop };
};
