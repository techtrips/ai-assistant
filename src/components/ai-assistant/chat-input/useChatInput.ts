import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VoiceInputHandle } from "./voice-input";
import type { IStarterPrompt } from "../AIAssistant.types";

export const useChatInput = (
	isStreaming: boolean,
	onSend: (text: string) => void,
	starterPrompts?: IStarterPrompt[],
	onSelectPrompt?: (prompt: IStarterPrompt) => void,
) => {
	const [value, setValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const voiceRef = useRef<VoiceInputHandle>(null);
	const recordingBaseRef = useRef("");

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) el.focus();
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const handleSend = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed || isStreaming) return;
		voiceRef.current?.stop();
		onSend(trimmed);
		setValue("");
	}, [value, isStreaming, onSend]);

	const handleAttachClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(
			e: React.ChangeEvent<HTMLInputElement>,
			onFileSelect?: (file: File) => void,
		) => {
			const file = e.target.files?.[0];
			if (file && onFileSelect) {
				onFileSelect(file);
			}
			e.target.value = "";
		},
		[],
	);

	const handleVoiceStart = useCallback(() => {
		recordingBaseRef.current = value;
	}, [value]);

	const handleVoiceTranscript = useCallback((transcript: string) => {
		const next = [recordingBaseRef.current, transcript]
			.filter(Boolean)
			.join(" ")
			.trim();
		setValue(next);
	}, []);

	const handleVoiceStop = useCallback((message: string) => {
		if (message.trim()) {
			const next = [recordingBaseRef.current, message]
				.filter(Boolean)
				.join(" ")
				.trim();
			setValue(next);
		} else {
			setValue(recordingBaseRef.current);
		}
	}, []);

	const hasInput = value.trim().length > 0;

	/* ── Autocomplete suggestions ── */
	const prompts = starterPrompts ?? [];
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

	const filteredSuggestions = useMemo(() => {
		const trimmed = value.trim();
		if (!trimmed) return [];
		const lower = trimmed.toLowerCase();
		return prompts.filter(
			(sp) =>
				sp.title.toLowerCase().includes(lower) ||
				(sp.prompt?.toLowerCase().includes(lower) ?? false),
		);
	}, [prompts, value]);

	useEffect(() => {
		setSelectedSuggestionIndex(-1);
	}, [filteredSuggestions.length]);

	const handleSelectSuggestion = useCallback(
		(sp: IStarterPrompt) => {
			setShowSuggestions(false);
			if (onSelectPrompt && sp.parameters && sp.parameters.length > 0) {
				onSelectPrompt(sp);
			} else {
				const message = sp.prompt ?? sp.title;
				onSend(message);
			}
			setValue("");
		},
		[onSend, onSelectPrompt],
	);

	const handleFocus = useCallback(() => {
		if (value.trim().length > 0) setShowSuggestions(true);
	}, [value]);

	const handleBlur = useCallback(() => {
		// Delay so mousedown on a suggestion fires before the dropdown hides
		setTimeout(() => setShowSuggestions(false), 150);
	}, []);

	// Override handleKeyDown to intercept arrow/enter/escape when suggestions visible
	const handleKeyDownWithSuggestions = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			const hasSuggestions = showSuggestions && filteredSuggestions.length > 0;

			if (hasSuggestions) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					setSelectedSuggestionIndex((prev) =>
						prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
					);
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					setSelectedSuggestionIndex((prev) =>
						prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
					);
					return;
				}
				if (e.key === "Enter" && !e.shiftKey && selectedSuggestionIndex >= 0) {
					e.preventDefault();
					handleSelectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					setShowSuggestions(false);
					return;
				}
			}

			// Default: normal Enter-to-send
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[
			showSuggestions,
			filteredSuggestions,
			selectedSuggestionIndex,
			handleSelectSuggestion,
			handleSend,
		],
	);

	const setValueWithSuggestions = useCallback(
		(v: string) => {
			setValue(v);
			setShowSuggestions(v.trim().length > 0 && prompts.length > 0);
		},
		[prompts.length],
	);

	return {
		value,
		setValue: setValueWithSuggestions,
		hasInput,
		textareaRef,
		fileInputRef,
		voiceRef,
		handleSend,
		handleKeyDown: handleKeyDownWithSuggestions,
		handleAttachClick,
		handleFileChange,
		handleVoiceStart,
		handleVoiceTranscript,
		handleVoiceStop,
		showSuggestions,
		filteredSuggestions,
		selectedSuggestionIndex,
		setSelectedSuggestionIndex,
		handleSelectSuggestion,
		handleFocus,
		handleBlur,
	};
};
