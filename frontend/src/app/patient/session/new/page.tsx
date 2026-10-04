/* PhysioCare — Camera setup placeholder. Expected result: explain the demo exercise, privacy boundary, and readiness checks before opening real on-device pose analysis. */

import Link from 'next/link';
import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { Alert, Badge } from '@/components/ui';
import { DEMO_EXERCISE, DEMO_SESSIONS } from '@/data/phase1DemoData';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';

/**
 * Render exercise instructions and camera/privacy setup information.
 *
 * @returns A pre-session setup page linking to the live camera route.
 */
export default function SessionSetupPage(): React.JSX.Element {
  const latestSession = DEMO_SESSIONS[DEMO_SESSIONS.length - 1];

  return (
    <Phase1PortalShell role="patient" activeHref={PHASE1_ROUTES.sessionSetup}>
      <div className="grid gap-8">
        <section>
          <Badge variant="primary">訓練前準備 · Before you begin</Badge>
          <h1 className="mt-4 text-pc-36 font-bold leading-tight">先確認鏡頭和空間準備好了。</h1>
          <p className="mt-3 max-w-3xl text-pc-16 leading-relaxed text-ink-muted">
            找一個能看見全身的位置，確認椅子穩固，再開始{DEMO_EXERCISE.name}。
          </p>
        </section>
        <div className="grid gap-8 lg:grid-cols-[1fr_.8fr]">
          <section className="grid min-h-72 place-items-center bg-neutral-100 p-card" aria-label="Camera setup preview">
            <div className="text-center">
              <div aria-hidden="true" className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-primary-600 text-pc-36 text-primary-800">＋</div>
              <h2 className="mt-5 text-pc-20 font-semibold">鏡頭預覽會在下一步開啟</h2>
              <p className="mt-2 text-pc-14 text-ink-muted">瀏覽器將在即時分析頁面請求鏡頭權限。</p>
            </div>
          </section>
          <section aria-labelledby="exercise-setup-title">
            <h2 id="exercise-setup-title" className="text-pc-24 font-semibold">{DEMO_EXERCISE.name}</h2>
            <p className="mt-2 text-pc-14 leading-relaxed text-ink-muted">{DEMO_EXERCISE.description}</p>
            <dl className="mt-5 grid gap-3">
              <div className="flex justify-between gap-4 border-b border-line py-3"><dt className="text-pc-14 text-ink-muted">目標</dt><dd className="text-pc-14 font-semibold">{DEMO_EXERCISE.targetSets} 組 × {DEMO_EXERCISE.targetReps} 次</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-3"><dt className="text-pc-14 text-ink-muted">訓練目的</dt><dd className="text-pc-14 font-semibold">{DEMO_EXERCISE.clinicalGoal}</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-3"><dt className="text-pc-14 text-ink-muted">最近完成</dt><dd className="text-pc-14 font-semibold">{latestSession.repsCompleted} 次</dd></div>
            </dl>
            <Alert tone="info" className="mt-6" title="鏡頭與資料私隱">
              姿勢分析在此裝置上進行。此示範不會上傳影片，也不會把本次練習寫入後端。
            </Alert>
            <p className="mt-5 text-pc-14 leading-relaxed text-ink-muted">{DEMO_EXERCISE.safetyNote}</p>
            <Link
              href={PHASE1_ROUTES.liveSession(DEMO_SESSIONS[DEMO_SESSIONS.length - 1].id)}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-sm bg-primary-700 px-5 text-pc-16 font-semibold text-neutral-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2"
            >
              開啟鏡頭分析
            </Link>
          </section>
        </div>
      </div>
    </Phase1PortalShell>
  );
}
