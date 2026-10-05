/* PhysioCare — Token-based action button. Expected result: clear primary, secondary, and quiet actions with visible focus, disabled, and loading states. */

'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-700 text-neutral-50 hover:bg-primary-800 disabled:bg-neutral-200 disabled:text-neutral-500',
  secondary: 'bg-primary-50 text-primary-800 hover:bg-primary-100 disabled:bg-neutral-100 disabled:text-neutral-400',
  quiet: 'bg-transparent text-neutral-700 hover:bg-neutral-100 disabled:text-neutral-400',
  danger: 'bg-danger-700 text-neutral-50 hover:bg-danger-800 disabled:bg-neutral-200 disabled:text-neutral-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-pc-14',
  md: 'min-h-11 px-4 text-pc-16',
  lg: 'min-h-12 px-5 text-pc-16',
};

/**
 * Render an accessible action button with token-backed visual states.
 *
 * @param props - Native button props plus variant, size, and loading state.
 * @returns A styled button element.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors duration-quick ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}
