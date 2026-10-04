/* PhysioCare — Safety and status alert. Expected result: concise, readable feedback with an icon-free text label and semantic visual treatment. */

import type { HTMLAttributes, ReactNode } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
  tone?: AlertTone;
}

const toneClasses: Record<AlertTone, string> = {
  info: 'border-info-600 bg-info-50 text-info-900',
  success: 'border-success-600 bg-success-50 text-success-900',
  warning: 'border-warning-600 bg-warning-50 text-warning-900',
  danger: 'border-danger-600 bg-danger-50 text-danger-900',
};

/**
 * Render a semantic message for safety, status, or helpful guidance.
 *
 * @param props - Message title, body, tone, and native div attributes.
 * @returns An alert region with a visible text heading.
 */
export function Alert({
  title,
  children,
  tone = 'info',
  className = '',
  ...props
}: AlertProps): React.JSX.Element {
  return (
    <div
      {...props}
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`border-l-4 p-4 ${toneClasses[tone]} ${className}`}
    >
      <p className="text-pc-14 font-semibold">{title}</p>
      <div className="mt-1 text-pc-14 leading-relaxed">{children}</div>
    </div>
  );
}
