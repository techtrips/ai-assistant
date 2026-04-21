import { useCallback, useEffect, useRef, useState } from "react";
import { useAIAssistantContext } from "../AIAssistantContext";
import type { IStarterPrompt } from "../AIAssistant.types";
import { useStarterPromptChipsStyles } from "./StarterPromptChips.styles";

const VISIBLE_COUNT = 10;

export const StarterPromptChips = () => {
	const classes = useStarterPromptChipsStyles();
	const { selectPrompt, starterPrompts, starterPromptsLoading } =
		useAIAssistantContext();
	const [showOverflow, setShowOverflow] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const visiblePrompts = starterPrompts.slice(0, VISIBLE_COUNT);
	const overflowPrompts = starterPrompts.slice(VISIBLE_COUNT);
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

	const handleSelect = useCallback(
		(prompt: IStarterPrompt) => {
			selectPrompt(prompt);
		},
		[selectPrompt],
	);

	if (starterPromptsLoading) {
		return (
			<div className={classes.root}>
				<div className={classes.skeletonRow}>
					<div className={classes.shimmerChip} style={{ width: "100px" }} />
					<div className={classes.shimmerChip} style={{ width: "120px" }} />
					<div className={classes.shimmerChip} style={{ width: "90px" }} />
				</div>
			</div>
		);
	}

	if (starterPrompts.length === 0) return null;

	return (
		<div className={classes.root}>
			{visiblePrompts.map((prompt, idx) => (
				<button
					key={`${prompt.id ?? prompt.title}-${idx}`}
					type="button"
					className={classes.chip}
					onClick={() => handleSelect(prompt)}
				>
					{prompt.title}
				</button>
			))}
			{hasOverflow && (
				<div className={classes.moreWrapper} ref={dropdownRef}>
					<button
						className={classes.moreChip}
						type="button"
						onClick={() => setShowOverflow((prev) => !prev)}
					>
						+{overflowPrompts.length} more
					</button>
					{showOverflow && (
						<div className={classes.overflowDropdown}>
							{overflowPrompts.map((prompt, idx) => (
								<button
									key={`${prompt.id ?? prompt.title}-o-${idx}`}
									className={classes.overflowItem}
									type="button"
									onClick={() => handleSelect(prompt)}
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
