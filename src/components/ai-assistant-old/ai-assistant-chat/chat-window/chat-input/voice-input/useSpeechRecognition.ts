import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
	readonly results: SpeechRecognitionResultList;
	readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string;
	readonly message: string;
}

interface ISpeechRecognitionInstance extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start(): void;
	stop(): void;
	abort(): void;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
	onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
	const win = window as unknown as Record<string, unknown>;
	return (win.SpeechRecognition ?? win.webkitSpeechRecognition) as
		| SpeechRecognitionConstructor
		| undefined;
}

export interface UseSpeechRecognitionReturn {
	isSupported: boolean;
	isListening: boolean;
	interimTranscript: string;
	startListening: () => void;
	stopListening: () => void;
	abortListening: () => void;
}

export function useSpeechRecognition(
	onTranscript: (transcript: string) => void,
	onFinalResult: (transcript: string) => void,
	lang = "en-US",
): UseSpeechRecognitionReturn {
	const [isListening, setIsListening] = useState(false);
	const [interimTranscript, setInterimTranscript] = useState("");
	const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
	const stoppingRef = useRef(false);
	const accumulatedRef = useRef("");
	const isSupported =
		typeof window !== "undefined" && !!getSpeechRecognitionCtor();

	useEffect(() => {
		return () => {
			stoppingRef.current = true;
			recognitionRef.current?.abort();
		};
	}, []);

	const startListening = useCallback(() => {
		const SpeechRecognitionCtor = getSpeechRecognitionCtor();

		if (!SpeechRecognitionCtor) {
			return;
		}

		stoppingRef.current = true;
		recognitionRef.current?.abort();
		stoppingRef.current = false;
		accumulatedRef.current = "";

		const createRecognition = () => {
			const recognition = new SpeechRecognitionCtor();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = lang;
			recognitionRef.current = recognition;

			recognition.onstart = () => {
				setIsListening(true);
			};

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				let interim = "";
				let newFinal = "";

				for (
					let index = event.resultIndex;
					index < event.results.length;
					index++
				) {
					const result = event.results[index];

					if (result.isFinal) {
						newFinal += result[0].transcript;
					} else {
						interim += result[0].transcript;
					}
				}

				if (newFinal) {
					accumulatedRef.current = (
						accumulatedRef.current +
						" " +
						newFinal
					).trim();
					setInterimTranscript("");
					onFinalResult(accumulatedRef.current);
				}

				if (interim) {
					const fullTranscript = accumulatedRef.current
						? `${accumulatedRef.current} ${interim}`
						: interim;

					setInterimTranscript(interim);
					onTranscript(fullTranscript.trim());
				}
			};

			recognition.onerror = (_event: SpeechRecognitionErrorEvent) => {
				// Ignore transient no-speech and aborted states.
			};

			recognition.onend = () => {
				recognitionRef.current = null;

				if (!stoppingRef.current) {
					try {
						const nextRecognition = createRecognition();
						nextRecognition.start();
					} catch {
						setIsListening(false);
					}
				} else {
					setIsListening(false);
					setInterimTranscript("");
				}
			};

			return recognition;
		};

		const recognition = createRecognition();
		recognition.start();
	}, [lang, onFinalResult, onTranscript]);

	const stopListening = useCallback(() => {
		stoppingRef.current = true;
		recognitionRef.current?.stop();
	}, []);

	const abortListening = useCallback(() => {
		stoppingRef.current = true;
		recognitionRef.current?.abort();
	}, []);

	return {
		isSupported,
		isListening,
		interimTranscript,
		startListening,
		stopListening,
		abortListening,
	};
}
