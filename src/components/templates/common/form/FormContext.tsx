import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	ControlValue,
	IInputFieldControl,
	ITemplateControl,
} from "../../templates.models";
import { ControlType } from "../../templates.models";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface IFormContextValue {
	values: Record<string, ControlValue>;
	errors: Record<string, string | undefined>;
	onChange: (name: string, value: ControlValue) => void;
	/** Validate all registered fields. Returns true when the form is valid. */
	validate: () => boolean;
}

const FormContext = createContext<IFormContextValue | undefined>(undefined);

/** Consume the nearest FormContext (if any). */
export const useFormContext = () => useContext(FormContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface IFormProviderProps {
	/** All controls in this container — InputField controls are auto-registered. */
	controls: ITemplateControl[];
	children: React.ReactNode;
}

export const FormProvider: React.FC<IFormProviderProps> = ({
	controls,
	children,
}) => {
	// Extract InputField controls from the flat list
	const inputFields = useMemo(
		() =>
			controls.filter(
				(c): c is IInputFieldControl => c.type === ControlType.InputField,
			),
		[controls],
	);

	// Initialise values from defaultValue
	const [values, setValues] = useState<Record<string, ControlValue>>(() => {
		const initial: Record<string, ControlValue> = {};
		for (const field of inputFields) {
			initial[field.name] = field.defaultValue?.value ?? null;
		}
		return initial;
	});

	// Track which fields the user has manually edited
	const touchedRef = useRef<Set<string>>(new Set());

	// When resolved default values change (e.g. binding data arrives), sync
	// untouched fields so bound defaults populate in the input.
	useEffect(() => {
		setValues((prev) => {
			let next = prev;
			for (const field of inputFields) {
				const resolved = field.defaultValue?.value ?? null;
				if (
					!touchedRef.current.has(field.name) &&
					resolved !== prev[field.name]
				) {
					if (next === prev) next = { ...prev };
					next[field.name] = resolved;
				}
			}
			return next;
		});
	}, [inputFields]);

	const [errors, setErrors] = useState<Record<string, string | undefined>>({});

	const onChange = useCallback((name: string, value: ControlValue) => {
		touchedRef.current.add(name);
		setValues((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
	}, []);

	const validate = useCallback((): boolean => {
		const newErrors: Record<string, string | undefined> = {};
		let valid = true;
		for (const field of inputFields) {
			const val = values[field.name];
			if (field.required && (val == null || String(val).trim() === "")) {
				newErrors[field.name] =
					field.validation?.message ?? `${field.label} is required`;
				valid = false;
			} else if (field.validation?.pattern && val != null) {
				const regex = new RegExp(field.validation.pattern);
				if (!regex.test(String(val))) {
					newErrors[field.name] =
						field.validation.message ?? `${field.label} is invalid`;
					valid = false;
				}
			}
		}
		setErrors(newErrors);
		return valid;
	}, [inputFields, values]);

	const ctx = useMemo<IFormContextValue>(
		() => ({ values, errors, onChange, validate }),
		[values, errors, onChange, validate],
	);

	return <FormContext.Provider value={ctx}>{children}</FormContext.Provider>;
};
