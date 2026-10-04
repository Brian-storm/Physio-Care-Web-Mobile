/* PhysioCare — Accessible score visualization. Expected result: a labeled 0–100 progress measure with semantic color and a text value. */

export type ScoreTone = 'primary' | 'success' | 'warning' | 'danger';

export interface ScoreBarProps {
  label: string;
  value: number;
  tone?: ScoreTone;
  className?: string;
}

const toneClasses: Record<ScoreTone, string> = {
  primary: 'bg-primary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
};

/**
 * Render a labeled, accessible score bar with the numeric value visible.
 *
 * @param props - Human-readable label, score from 0 to 100, tone, and classes.
 * @returns A labeled score visualization.
 */
export function ScoreBar({
  label,
  value,
  tone = 'primary',
  className = '',
}: ScoreBarProps): React.JSX.Element {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-pc-14 font-medium text-ink">{label}</span>
        <span className="text-pc-14 font-semibold tabular-nums text-ink">
          {safeValue} / 100
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
        className="h-2 overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-standard ease-brand ${toneClasses[tone]}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
