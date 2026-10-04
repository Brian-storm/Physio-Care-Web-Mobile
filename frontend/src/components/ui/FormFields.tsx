/* PhysioCare — Labeled native form controls. Expected result: keyboard-accessible input and select fields with consistent help, error, and disabled states. */

'use client';

import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/**
 * Render a label and optional helper/error copy around a native control.
 *
 * @param props - Stable control id, label, helper/error text, and control node.
 * @returns A labeled field wrapper.
 */
function FieldShell({ id, label, hint, error, children }: FieldShellProps): React.JSX.Element {
  const messageId = `${id}-message`;

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-pc-14 font-semibold text-ink">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p
          id={messageId}
          className={`text-pc-13 leading-relaxed ${error ? 'text-danger-700' : 'text-ink-muted'}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Render a labeled text input with associated help or error messaging.
 *
 * @param props - Native input attributes, label, optional hint/error, and id.
 * @returns A labeled native input.
 */
export function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = '',
  disabled = false,
  ...props
}: TextFieldProps): React.JSX.Element {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const messageId = `${id}-message`;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        {...props}
        id={id}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
        className={`min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-pc-16 text-ink placeholder:text-ink-muted focus-visible:border-info-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 ${error ? 'border-danger-600' : ''} ${className}`}
      />
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  placeholder?: string;
}

/**
 * Render a labeled native select with a placeholder and accessible messages.
 *
 * @param props - Native select attributes, label, options, and optional messages.
 * @returns A labeled native select.
 */
export function SelectField({
  label,
  options,
  hint,
  error,
  placeholder,
  id: suppliedId,
  className = '',
  disabled = false,
  ...props
}: SelectFieldProps): React.JSX.Element {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const messageId = `${id}-message`;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        {...props}
        id={id}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
        className={`min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-pc-16 text-ink focus-visible:border-info-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 ${error ? 'border-danger-600' : ''} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
