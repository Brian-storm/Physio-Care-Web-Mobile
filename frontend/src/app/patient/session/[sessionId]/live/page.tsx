/* PhysioCare — Live exercise route placeholder. Expected result: keep the existing real-time squat analyzer reachable through the approved Phase 1 patient journey. */

import { LiveExerciseAnalysis } from '@/components/session/LiveExerciseAnalysis';

export interface LiveSessionPageProps {
  params: { sessionId: string };
}

/**
 * Render the on-device squat-analysis workspace for a demo session route.
 *
 * @param props - The route's synthetic session identifier.
 * @returns The existing camera and pose analysis experience.
 */
export default function LiveSessionPage({ params }: LiveSessionPageProps): React.JSX.Element {
  return <LiveExerciseAnalysis sessionId={params.sessionId} />;
}
