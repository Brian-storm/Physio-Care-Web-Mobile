/* PhysioCare — Selective content surface. Expected result: a restrained content plane with optional header/footer and no forced dashboard-card grid. */

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  surface?: 'plain' | 'subtle' | 'raised';
}

const surfaceClasses: Record<NonNullable<CardProps['surface']>, string> = {
  plain: 'bg-surface',
  subtle: 'bg-neutral-100',
  raised: 'bg-surface shadow-panel',
};

/**
 * Render a content surface that can be composed around meaningful page sections.
 *
 * @param props - Semantic section attributes, content, and surface treatment.
 * @returns A semantic section element.
 */
export function Card({
  children,
  surface = 'plain',
  className = '',
  ...props
}: CardProps): React.JSX.Element {
  return (
    <section
      {...props}
      className={`p-card ${surfaceClasses[surface]} ${className}`}
    >
      {children}
    </section>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Render the heading region of a content surface.
 *
 * @param props - Container attributes and header content.
 * @returns A header container element.
 */
export function CardHeader({ children, className = '', ...props }: CardHeaderProps): React.JSX.Element {
  return (
    <div {...props} className={`mb-6 ${className}`}>
      {children}
    </div>
  );
}
