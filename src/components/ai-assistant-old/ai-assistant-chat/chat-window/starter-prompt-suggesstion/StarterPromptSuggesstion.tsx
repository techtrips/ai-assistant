import { useState, useRef, useEffect, useCallback } from "react";
import { IStarterPromptSuggesstionProps } from "./StarterPromptSuggesstion.models";
import { useAIAssistantChatStyles } from "../../AIAssistantChat.styles";
import { IAIAssistantStarterPrompt } from "../../../AIAssistant.models";

const VISIBLE_COUNT = 10;

const SHIMMER_ROW_1_WIDTHS = [190, 160, 175, 165, 155];
const SHIMMER_ROW_2_WIDTHS = [125, 105, 150, 180, 120, 70];

const StarterPromptSkeleton = () => {
	const classes = useAIAssistantChatStyles();

	return (
		<div className={classes.starterPromptSkeletonContainer}>
			<div className={classes.starterPromptSkeletonRow}>
				{SHIMMER_ROW_1_WIDTHS.map((w, i) => (
					<div
						key={`row-1-${i}`}
						className={classes.starterPromptShimmerChip}
						style={{ width: `${w}px` }}
					/>
				))}
			</div>
			<div className={classes.starterPromptSkeletonRow}>
				{SHIMMER_ROW_2_WIDTHS.map((w, i) => (
					<div
						key={`row-2-${i}`}
						className={classes.starterPromptShimmerChip}
						style={{ width: `${w}px` }}
					/>
				))}
			</div>
		</div>
	);
};

export const StarterPromptSuggesstion = (
	props: IStarterPromptSuggesstionProps,
) => {
	const { prompts, onSelectPrompt } = props;
	const classes = useAIAssistantChatStyles();
	const [showOverflow, setShowOverflow] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const isLoading = prompts?.loading ?? false;
	const promptList = prompts?.data ?? [];
	const visiblePrompts = promptList.slice(0, VISIBLE_COUNT);
	const overflowPrompts = promptList.slice(VISIBLE_COUNT);
	const hasOverflow = overflowPrompts.length > 0;

	useEffect(() => {
		if (!showOverflow) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setShowOverflow(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showOverflow]);

	const handleOverflowSelect = useCallback(
		(prompt: IAIAssistantStarterPrompt) => {
			setShowOverflow(false);
			onSelectPrompt(prompt);
		},
		[onSelectPrompt],
	);

	if (isLoading) {
		return <StarterPromptSkeleton />;
	}

	if (promptList.length === 0) {
		return null;
	}

	return (
		<div className={classes.starterPrompts}>
			{visiblePrompts.map((prompt, idx) => (
				<button
					key={`${prompt.id}-${idx}`}
					type="button"
					className={classes.starterPromptChip}
					onClick={() => onSelectPrompt(prompt)}
				>
					{prompt.title}
				</button>
			))}
			{hasOverflow && (
				<div className={classes.starterPromptMoreWrapper} ref={dropdownRef}>
					<button
						className={classes.starterPromptMoreChip}
						onClick={() => setShowOverflow((prev) => !prev)}
						type="button"
					>
						+{overflowPrompts.length} more
					</button>
					{showOverflow && (
						<div className={classes.starterPromptOverflowDropdown}>
							{overflowPrompts.map((prompt, idx) => (
								<button
									key={`${prompt.id}-overflow-${idx}`}
									className={classes.starterPromptOverflowItem}
									onClick={() => handleOverflowSelect(prompt)}
									type="button"
								>
									{prompt.title}
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
