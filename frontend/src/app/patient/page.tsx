/* PhysioCare — Patient portal placeholder. Expected result: show Maya's goal, weekly progress, next exercise, and links into the camera workflow and results. */

import Link from 'next/link';
import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { MovementTrace } from '@/components/patient/MovementTrace';
import { Badge, ScoreBar } from '@/components/ui';
import { DEMO_EXERCISE, DEMO_PATIENT, DEMO_PROGRESS, DEMO_SESSIONS } from '@/data/phase1DemoData';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';

/**
 * Render the patient portal with synthetic Phase 1 progress fixtures.
 *
 * @returns A patient home page with a next-exercise action and recent progress.
 */
export default function PatientPortalPage(): React.JSX.Element {
  const latestSession = DEMO_SESSIONS[DEMO_SESSIONS.length - 1];

  return (
    <Phase1PortalShell role="patient" activeHref={PHASE1_ROUTES.patientHome}>
      <div className="grid gap-8">
        <section>
          <p className="text-pc-14 font-semibold text-primary-800">今日訓練 · Today</p>
          <h1 className="mt-2 text-pc-36 font-bold leading-tight text-ink">
            {DEMO_PATIENT.name}，今天一起練習{DEMO_EXERCISE.name}。
          </h1>
          <p className="mt-3 max-w-3xl text-pc-16 leading-relaxed text-ink-muted">{DEMO_PATIENT.rehabGoal}</p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <MovementTrace
            title="你正在建立穩定的動作路徑"
            description="最近 4 次練習的動作品質逐步提升。"
          />
          <section className="bg-surface p-card" aria-labelledby="weekly-progress-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="weekly-progress-title" className="text-pc-20 font-semibold">本週復健概況</h2>
              <Badge variant="success">持續進步</Badge>
            </div>
            <div className="mt-6 grid gap-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-pc-14 text-ink-muted">完成訓練</span>
                <strong className="text-pc-24 tabular-nums">3 / {DEMO_PATIENT.weeklyTargetSessions} 次</strong>
              </div>
              <ScoreBar label="平均動作品質" value={DEMO_PROGRESS.averageFormScore} />
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-pc-14 text-ink-muted">累積深蹲</span>
                <strong className="text-pc-20 tabular-nums">{DEMO_PROGRESS.totalReps} 次</strong>
              </div>
              <p className="border-l-4 border-warning-600 pl-3 text-pc-14 leading-relaxed text-warning-800">
                治療師目標：{DEMO_EXERCISE.clinicalGoal}。測量與提示供治療師檢視，不是診斷。
              </p>
              <Link
                href={PHASE1_ROUTES.sessionSetup}
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-primary-700 px-5 text-pc-16 font-semibold text-neutral-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2"
              >
                開始{DEMO_EXERCISE.name}
              </Link>
            </div>
          </section>
        </div>

        <section aria-labelledby="recent-session-title" className="border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="recent-session-title" className="text-pc-20 font-semibold">最近一次訓練</h2>
              <p className="mt-1 text-pc-14 text-ink-muted">椅子深蹲 · {latestSession.repsCompleted} / {DEMO_EXERCISE.targetReps} 次 · 動作品質 {latestSession.averageFormScore} / 100</p>
            </div>
            <Link href={PHASE1_ROUTES.patientResult(latestSession.id)} className="text-pc-14 font-semibold text-primary-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500">
              查看訓練結果
            </Link>
          </div>
        </section>
      </div>
    </Phase1PortalShell>
  );
}
