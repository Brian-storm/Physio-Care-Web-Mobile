/* PhysioCare — Patient movement-path illustration. Expected result: a token-colored movement visual that explains squat measurement without implying diagnosis. */

export interface MovementTraceProps {
  title?: string;
  description?: string;
}

/**
 * Render a lightweight pose-path illustration for the patient portal.
 *
 * @param props - Optional heading and supporting description.
 * @returns A responsive, accessible squat movement illustration.
 */
export function MovementTrace({
  title = '動作路徑',
  description = '深蹲姿勢測量示意',
}: MovementTraceProps): React.JSX.Element {
  return (
    <figure className="bg-primary-50 p-card shadow-panel">
      <figcaption className="mb-4">
        <h2 className="text-pc-20 font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-pc-14 leading-relaxed text-ink-muted">{description}</p>
      </figcaption>
      <svg
        viewBox="0 0 640 220"
        role="img"
        aria-label="深蹲姿勢骨架與動作路徑示意"
        className="h-52 w-full"
      >
        <path
          d="M38 178C125 170 180 150 245 149S378 113 456 94S550 60 605 42"
          fill="none"
          stroke="var(--pc-primary-600)"
          strokeDasharray="7 8"
          strokeWidth="3"
        />
        <circle cx="322" cy="40" r="15" fill="var(--pc-neutral-900)" />
        <path
          d="M322 57L328 105L374 130L420 178M328 105L282 139L252 187M328 105L374 130L372 169L420 198M328 105L282 139L286 174L252 198"
          fill="none"
          stroke="var(--pc-neutral-900)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <circle cx="328" cy="105" r="7" fill="var(--pc-primary-600)" />
        <circle cx="374" cy="130" r="7" fill="var(--pc-primary-600)" />
        <circle cx="282" cy="139" r="7" fill="var(--pc-primary-600)" />
      </svg>
    </figure>
  );
}
