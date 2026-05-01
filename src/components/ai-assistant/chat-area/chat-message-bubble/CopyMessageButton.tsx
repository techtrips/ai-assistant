import { Button, Tooltip } from "@fluentui/react-components";
import { Checkmark16Regular, Copy16Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IChatMessage } from "../../AIAssistant.types";

interface ICopyMessageButtonProps {
	message: IChatMessage;
	className?: string;
}

/**
 * Hover-revealed button that copies a message's text to the clipboard.
 * Prefers `message.content` (the markdown source — most useful when pasting
 * into another agent or doc) and falls back to a serialized payload for
 * tool-result-only messages.
 */
export const CopyMessageButton = ({
	message,
	className,
}: ICopyMessageButtonProps) => {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[],
	);

	const handleCopy = useCallback(async () => {
		const text =
			(typeof message.content === "string" && message.content.length > 0
				? message.content
				: message.data?.payload) ?? "";
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => setCopied(false), 1500);
		} catch {
			/* clipboard unavailable — silently ignore */
		}
	}, [message]);

	return (
		<Tooltip
			content={copied ? "Copied" : "Copy message"}
			relationship="label"
			withArrow
		>
			<Button
				appearance="subtle"
				size="small"
				icon={copied ? <Checkmark16Regular /> : <Copy16Regular />}
				onClick={handleCopy}
				className={`agent-chat-copy ${className ?? ""}`}
				aria-label="Copy message"
			/>
		</Tooltip>
	);
};
