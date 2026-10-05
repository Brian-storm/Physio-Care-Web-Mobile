/* PhysioCare — Native checkbox and radio controls. Expected result: clearly labeled, keyboard-operable choices with visible focus and disabled states. */

'use client';

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
}

/**
 * Render a labeled native checkbox for an optional patient choice.
 *
 * @param props - Checkbox state, accessible label, optional hint, and input attributes.
 * @returns A labeled checkbox control.
 */
export function CheckboxField({
  label,
  hint,
  id: suppliedId,
  className = '',
  disabled = false,
  ...props
}: CheckboxFieldProps): React.JSX.Element {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const hintId = `${id}-hint`;

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="inline-flex items-start gap-3 text-pc-14 text-ink">
        <input
          {...props}
          id={id}
          type="checkbox"
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          className={`mt-1 h-4 w-4 accent-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 disabled:cursor-not-allowed ${className}`}
        />
        <span>{label}</span>
      </label>
      {hint && <p id={hintId} className="pl-7 text-pc-13 leading-relaxed text-ink-muted">{hint}</p>}
    </div>
  );
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupFieldProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/**
 * Render a fieldset of native radio controls with one accessible group label.
 *
 * @param props - Legend, shared name, options, selected value, and change handler.
 * @returns A semantic radio group.
 */
export function RadioGroupField({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
}: RadioGroupFieldProps): React.JSX.Element {
  const groupId = useId();

  return (
    <fieldset disabled={disabled} className="grid gap-3">
      <legend className="text-pc-14 font-semibold text-ink">{legend}</legend>
      {options.map((option, index) => {
        const optionId = `${groupId}-${index}`;

        return (
          <label key={option.value} htmlFor={optionId} className="flex items-start gap-3 text-pc-14 text-ink">
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={disabled || option.disabled}
              onChange={() => onChange?.(option.value)}
              className="mt-1 h-4 w-4 accent-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 disabled:cursor-not-allowed"
            />
            <span>
              <span className="block">{option.label}</span>
              {option.description && <span className="mt-1 block text-pc-13 text-ink-muted">{option.description}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
