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

export function useSpeechRecognition(
	onTranscript: (transcript: string) => void,
	onFinalResult: (transcript: string) => void,
	lang = "en-US",
) {
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
		const Ctor = getSpeechRecognitionCtor();
		if (!Ctor) return;

		stoppingRef.current = true;
		recognitionRef.current?.abort();
		stoppingRef.current = false;
		accumulatedRef.current = "";

		const createRecognition = (): ISpeechRecognitionInstance => {
			const recognition = new Ctor();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = lang;
			recognitionRef.current = recognition;

			recognition.onstart = () => setIsListening(true);

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				let interim = "";
				let newFinal = "";

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const result = event.results[i];
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
					const full = accumulatedRef.current
						? `${accumulatedRef.current} ${interim}`
						: interim;
					setInterimTranscript(interim);
					onTranscript(full.trim());
				}
			};

			recognition.onerror = () => {
				// Ignore transient no-speech and aborted states
			};

			recognition.onend = () => {
				recognitionRef.current = null;
				if (!stoppingRef.current) {
					try {
						createRecognition().start();
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

		createRecognition().start();
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
