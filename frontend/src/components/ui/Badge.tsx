/* PhysioCare — Semantic status label. Expected result: readable status is conveyed by both text and color, never color alone. */

import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
  info: 'bg-info-100 text-info-800',
};

/**
 * Render a compact text label for a status or category.
 *
 * @param props - Label content, semantic color variant, and span attributes.
 * @returns A status label element.
 */
export function Badge({
  children,
  variant = 'neutral',
  className = '',
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <span
      {...props}
      className={`inline-flex items-center px-2 py-1 text-pc-12 font-semibold leading-none ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
