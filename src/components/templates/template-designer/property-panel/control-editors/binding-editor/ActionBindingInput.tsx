import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	FluentProvider,
	Input,
	mergeClasses,
	makeStyles,
	tokens,
	shorthands,
} from "@fluentui/react-components";
import { useTheme } from "../../../../../../resources/styles";
import { getTheme } from "../../../../../../resources/styles/theme/ThemeProvider.utils";

const useStyles = makeStyles({
	wrapper: {
		position: "relative",
		width: "100%",
	},
	input: {
		width: "100%",
		"& input::placeholder": {
			color: tokens.colorNeutralForeground3,
			opacity: 1,
		},
	},
	dropdown: {
		position: "fixed",
		zIndex: 10000000,
		maxHeight: "220px",
		overflowY: "auto",
		backgroundColor: tokens.colorNeutralBackground1,
		...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
		...shorthands.borderRadius(tokens.borderRadiusMedium),
		boxShadow: tokens.shadow16,
		boxSizing: "border-box",
	},
	sectionHeader: {
		...shorthands.padding("4px", "10px"),
		fontSize: tokens.fontSizeBase100,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground3,
		textTransform: "uppercase",
		letterSpacing: "0.5px",
		backgroundColor: tokens.colorNeutralBackground3,
		position: "sticky",
		top: "0px",
		zIndex: 1,
	},
	divider: {
		height: "1px",
		backgroundColor: tokens.colorNeutralStroke2,
	},
	item: {
		...shorthands.padding("6px", "10px"),
		fontSize: tokens.fontSizeBase200,
		cursor: "pointer",
		backgroundColor: tokens.colorNeutralBackground1,
		"&:hover": {
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
	},
	itemHighlighted: {
		backgroundColor: tokens.colorNeutralBackground1Hover,
	},
	itemLabel: {
		marginLeft: "8px",
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorNeutralForeground3,
	},
	hint: {
		...shorthands.padding("6px", "10px"),
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorNeutralForeground3,
		fontStyle: "italic",
	},
	invalidWarning: {
		...shorthands.padding("4px", "0"),
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorPaletteRedForeground1,
		display: "flex",
		flexWrap: "wrap" as const,
		gap: "4px",
		alignItems: "center",
	},
	invalidTag: {
		...shorthands.padding("1px", "6px"),
		...shorthands.borderRadius(tokens.borderRadiusSmall),
		backgroundColor: tokens.colorPaletteRedBackground1,
		color: tokens.colorPaletteRedForeground1,
		fontFamily: tokens.fontFamilyMonospace,
		fontSize: tokens.fontSizeBase100,
	},
	preview: {
		...shorthands.padding("6px", "8px"),
		marginTop: "4px",
		fontSize: tokens.fontSizeBase200,
		lineHeight: "20px",
		backgroundColor: tokens.colorNeutralBackground3,
		...shorthands.borderRadius(tokens.borderRadiusSmall),
		display: "flex",
		flexWrap: "wrap" as const,
		alignItems: "center",
		gap: "2px",
		wordBreak: "break-word" as const,
	},
	bindingChip: {
		...shorthands.padding("0px", "5px"),
		...shorthands.borderRadius(tokens.borderRadiusSmall),
		backgroundColor: tokens.colorBrandBackground2,
		color: tokens.colorBrandForeground2,
		fontFamily: tokens.fontFamilyMonospace,
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		whiteSpace: "nowrap" as const,
	},
	bindingChipInvalid: {
		...shorthands.padding("0px", "5px"),
		...shorthands.borderRadius(tokens.borderRadiusSmall),
		backgroundColor: tokens.colorPaletteRedBackground1,
		color: tokens.colorPaletteRedForeground1,
		fontFamily: tokens.fontFamilyMonospace,
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		textDecoration: "line-through",
		whiteSpace: "nowrap" as const,
	},
	bindingChipLabel: {
		fontFamily: tokens.fontFamilyBase,
		fontWeight: tokens.fontWeightRegular,
		marginLeft: "3px",
		opacity: 0.7,
	},
});

interface ActionBindingSection {
	label: string;
	paths: string[];
}

/**
 * An Input that shows a dropdown of binding paths when the user types `{`.
 * Selecting a path inserts `{path}` at the cursor position.
 *
 * Supports two sections:
 *  - `bindingPaths` — context-level paths (e.g. row fields, form fields)
 *  - `globalBindingPaths` — broader data source paths shown in a separate section
 */
export const ActionBindingInput = ({
	value,
	placeholder,
	bindingPaths,
	globalBindingPaths,
	pathLabels,
	onChange,
}: {
	value: string;
	placeholder?: string;
	/** Context-level binding paths (row fields, form fields, etc.) */
	bindingPaths: string[];
	/** Broader data source paths shown in a separate "Data Source" section */
	globalBindingPaths?: string[];
	/** Optional friendly labels for paths, keyed by path name */
	pathLabels?: Record<string, string>;
	onChange: (value: string) => void;
}) => {
	const classes = useStyles();
	const { currentTheme } = useTheme();
	const fluentTheme = getTheme(currentTheme);
	const [open, setOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [highlightIdx, setHighlightIdx] = useState(0);
	const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
	const [insertPos, setInsertPos] = useState<{ start: number; end: number }>({
		start: 0,
		end: 0,
	});
	const inputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const isSelectingRef = useRef(false);

	// Build sections: context paths + global paths (deduplicated)
	const sections = useMemo<ActionBindingSection[]>(() => {
		const contextSet = new Set(bindingPaths);
		const result: ActionBindingSection[] = [];

		if (bindingPaths.length > 0) {
			result.push({ label: "Form Fields", paths: bindingPaths });
		}

		if (globalBindingPaths && globalBindingPaths.length > 0) {
			const dedupedGlobal = globalBindingPaths.filter(
				(p) => !contextSet.has(p),
			);
			if (dedupedGlobal.length > 0) {
				result.push({ label: "Data Source", paths: dedupedGlobal });
			}
		}

		return result;
	}, [bindingPaths, globalBindingPaths]);

	// Flat list of all available paths for keyboard navigation
	const allPaths = useMemo(() => sections.flatMap((s) => s.paths), [sections]);

	// Position dropdown using fixed coordinates relative to the viewport
	useEffect(() => {
		if (!open || !wrapperRef.current) return;
		const rect = wrapperRef.current.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const placeAbove = spaceBelow < 220 && rect.top > spaceBelow;
		const style: React.CSSProperties = {
			left: rect.left,
			width: rect.width,
		};
		if (placeAbove) {
			style.bottom = window.innerHeight - rect.top + 2;
		} else {
			style.top = rect.bottom + 2;
		}
		setDropStyle(style);
	}, [open]);

	const findOpenBrace = useCallback(
		(
			text: string,
			cursorPos: number,
		): { start: number; partial: string } | null => {
			let i = cursorPos - 1;
			while (i >= 0) {
				if (text[i] === "}") return null;
				if (text[i] === "{") {
					return { start: i, partial: text.substring(i + 1, cursorPos) };
				}
				i--;
			}
			return null;
		},
		[],
	);

	const filteredSections = useMemo<ActionBindingSection[]>(() => {
		if (!filter) return sections;
		return sections
			.map((s) => ({
				...s,
				paths: s.paths.filter(
					(p) =>
						p.toLowerCase().includes(filter) ||
						(pathLabels?.[p]?.toLowerCase().includes(filter) ?? false),
				),
			}))
			.filter((s) => s.paths.length > 0);
	}, [sections, filter, pathLabels]);

	const filteredPaths = useMemo(
		() => filteredSections.flatMap((s) => s.paths),
		[filteredSections],
	);

	const insertPath = useCallback(
		(path: string) => {
			const before = value.substring(0, insertPos.start);
			const after = value.substring(insertPos.end);
			const newValue = `${before}{${path}}${after}`;
			onChange(newValue);
			setOpen(false);
			setHighlightIdx(0);

			requestAnimationFrame(() => {
				const pos = before.length + path.length + 2;
				inputRef.current?.focus();
				inputRef.current?.setSelectionRange(pos, pos);
			});
		},
		[value, insertPos, onChange],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const text = e.target.value;
			const cursor = e.target.selectionStart ?? text.length;
			onChange(text);

			const match = findOpenBrace(text, cursor);
			if (match && allPaths.length > 0) {
				setFilter(match.partial.toLowerCase());
				setInsertPos({ start: match.start, end: cursor });
				setHighlightIdx(0);
				setOpen(true);
			} else {
				setOpen(false);
			}
		},
		[onChange, findOpenBrace, allPaths.length],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!open || filteredPaths.length === 0) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightIdx((prev) =>
					prev < filteredPaths.length - 1 ? prev + 1 : 0,
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightIdx((prev) =>
					prev > 0 ? prev - 1 : filteredPaths.length - 1,
				);
			} else if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				insertPath(filteredPaths[highlightIdx]);
			} else if (e.key === "Escape") {
				e.preventDefault();
				setOpen(false);
			}
		},
		[open, filteredPaths, highlightIdx, insertPath],
	);

	const handleBlur = useCallback(() => {
		setTimeout(() => {
			if (!isSelectingRef.current) {
				setOpen(false);
			}
			isSelectingRef.current = false;
		}, 200);
	}, []);

	const hasContent = filteredPaths.length > 0;
	const showDropdown = open && hasContent;
	const showEmpty = open && !hasContent;
	const effectivePlaceholder = placeholder || "Type \u007B to insert bindings";
	const showSectionHeaders = filteredSections.length > 1;

	// Build flat index for highlight tracking
	let flatIdx = 0;
	const dropdownContent =
		showDropdown || showEmpty
			? createPortal(
					<FluentProvider theme={fluentTheme}>
						<div className={classes.dropdown} style={dropStyle} ref={listRef}>
							{showDropdown &&
								filteredSections.map((section, sIdx) => (
									<div key={section.label}>
										{showSectionHeaders && (
											<>
												{sIdx > 0 && <div className={classes.divider} />}
												<div className={classes.sectionHeader}>
													{section.label}
												</div>
											</>
										)}
										{section.paths.map((p) => {
											const thisIdx = flatIdx++;
											return (
												<div
													key={`${section.label}-${p}`}
													className={mergeClasses(
														classes.item,
														thisIdx === highlightIdx
															? classes.itemHighlighted
															: undefined,
													)}
													onMouseDown={() => {
														isSelectingRef.current = true;
													}}
													onClick={() => {
														insertPath(p);
													}}
													onMouseEnter={() => setHighlightIdx(thisIdx)}
												>
													{`{${p}}`}
													{pathLabels?.[p] && (
														<span className={classes.itemLabel}>
															— {pathLabels[p]}
														</span>
													)}
												</div>
											);
										})}
									</div>
								))}
							{showEmpty && (
								<div className={classes.hint}>No matching fields</div>
							)}
						</div>
					</FluentProvider>,
					document.body,
				)
			: null;
	// Reset flatIdx for next render
	flatIdx = 0;

	// Detect invalid bindings in the current value
	const invalidBindings = useMemo(() => {
		if (!value) return new Set<string>();
		const allKnown = new Set([...bindingPaths, ...(globalBindingPaths ?? [])]);
		const matches = value.match(/\{(\w+(?:\.\w+)*)\}/g);
		if (!matches) return new Set<string>();
		return new Set(
			matches.map((m) => m.slice(1, -1)).filter((name) => !allKnown.has(name)),
		);
	}, [value, bindingPaths, globalBindingPaths]);

	// Build rich preview segments
	const previewSegments = useMemo(() => {
		if (!value) return [];
		const segments: {
			type: "text" | "binding";
			content: string;
			valid: boolean;
		}[] = [];
		const regex = /\{(\w+(?:\.\w+)*)\}/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(value)) !== null) {
			if (match.index > lastIndex) {
				segments.push({
					type: "text",
					content: value.slice(lastIndex, match.index),
					valid: true,
				});
			}
			const name = match[1];
			segments.push({
				type: "binding",
				content: name,
				valid: !invalidBindings.has(name),
			});
			lastIndex = regex.lastIndex;
		}
		if (lastIndex < value.length) {
			segments.push({
				type: "text",
				content: value.slice(lastIndex),
				valid: true,
			});
		}
		return segments;
	}, [value, invalidBindings]);

	const hasBindings = previewSegments.some((s) => s.type === "binding");

	return (
		<div className={classes.wrapper} ref={wrapperRef}>
			<Input
				ref={inputRef}
				size="small"
				className={classes.input}
				placeholder={effectivePlaceholder}
				input={{ placeholder: effectivePlaceholder }}
				value={value ?? ""}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
			/>
			{dropdownContent}
			{hasBindings && (
				<div className={classes.preview}>
					{previewSegments.map((seg, i) =>
						seg.type === "text" ? (
							<span key={i}>{seg.content}</span>
						) : (
							<span
								key={i}
								className={
									seg.valid ? classes.bindingChip : classes.bindingChipInvalid
								}
							>
								{seg.content}
								{seg.valid && pathLabels?.[seg.content] && (
									<span className={classes.bindingChipLabel}>
										({pathLabels[seg.content]})
									</span>
								)}
							</span>
						),
					)}
				</div>
			)}
		</div>
	);
};
