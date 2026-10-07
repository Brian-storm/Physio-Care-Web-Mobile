/* PhysioCare — Patient result analysis placeholder. Expected result: show a selected demo session's movement measures, check-in, and comparison without backend persistence. */

import Link from 'next/link';
import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { Alert, Badge, ScoreBar } from '@/components/ui';
import { DEMO_EXERCISE, DEMO_PATIENT, DEMO_SESSIONS, findDemoSession } from '@/data/phase1DemoData';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';

export interface PatientResultPageProps {
  params: { sessionId: string };
}

/**
 * Render the result analysis page for one static demo session.
 *
 * @param props - The route's session identifier.
 * @returns A session measurement summary or a clear missing-session message.
 */
export default function PatientResultPage({ params }: PatientResultPageProps): React.JSX.Element {
  const session = findDemoSession(params.sessionId);
  const previousSession = DEMO_SESSIONS[DEMO_SESSIONS.length - 2];

  if (!session || session.patientId !== DEMO_PATIENT.id) {
    return (
      <Phase1PortalShell role="patient" activeHref={PHASE1_ROUTES.patientHome}>
        <Alert tone="warning" title="找不到這次示範訓練">
          請從患者入口選擇最近一次示範結果。
        </Alert>
        <Link href={PHASE1_ROUTES.patientHome} className="mt-5 inline-flex text-pc-14 font-semibold text-primary-800 underline underline-offset-4">返回患者入口</Link>
      </Phase1PortalShell>
    );
  }

  return (
    <Phase1PortalShell role="patient" activeHref={PHASE1_ROUTES.patientResult(session.id)}>
      <div className="grid gap-8">
        <section>
          <Badge variant="success">訓練完成 · Session complete</Badge>
          <h1 className="mt-4 text-pc-36 font-bold leading-tight">今天完成了 {session.repsCompleted} 次{DEMO_EXERCISE.name}。</h1>
          <p className="mt-3 max-w-3xl text-pc-16 leading-relaxed text-ink-muted">
            以下是本次訓練的動作測量和自我回報，供你與治療師檢視。
          </p>
        </section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section className="bg-primary-50 p-card">
            <h2 className="text-pc-24 font-semibold">動作品質</h2>
            <p className="mt-3 text-4xl font-bold tabular-nums text-primary-800">{session.averageFormScore}<span className="text-pc-18 font-medium text-ink-muted"> / 100</span></p>
            <ScoreBar label="本次平均測量" value={session.averageFormScore} className="mt-6" />
            <p className="mt-5 text-pc-14 leading-relaxed text-ink-muted">
              與前次 {previousSession.averageFormScore} 分相比，增加 {session.averageFormScore - previousSession.averageFormScore} 分。這項測量不是診斷。
            </p>
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-pc-16 font-semibold">今天訓練感受</h3>
              <p className="mt-2 text-pc-14 text-ink-muted">疼痛／不適自評：{session.painScore} / 10（示範紀錄，未儲存新回報）</p>
            </div>
          </section>
          <section>
            <h2 className="text-pc-24 font-semibold">本次訓練摘要</h2>
            <dl className="mt-3">
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">完成組數</dt><dd className="text-pc-16 font-semibold">{session.setsCompleted} 組</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">完成次數</dt><dd className="text-pc-16 font-semibold">{session.repsCompleted} / {DEMO_EXERCISE.targetReps}</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">最高風險分數</dt><dd className="text-pc-16 font-semibold">{session.maximumDangerScore} / 100</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">訓練時間</dt><dd className="text-pc-16 font-semibold">{Math.round(session.durationSeconds / 60)} 分鐘</dd></div>
            </dl>
            {session.flagged && <Alert tone="warning" className="mt-6" title="有一項動作訊號需要留意">{session.flagReason}</Alert>}
            <p className="mt-5 text-pc-13 leading-relaxed text-ink-muted">數據供治療師檢視參考，不會自動診斷或調整治療計劃。</p>
            <Link href={PHASE1_ROUTES.patientHome} className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-primary-700 px-4 text-pc-16 font-semibold text-neutral-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2">返回今日概況</Link>
          </section>
        </div>
      </div>
    </Phase1PortalShell>
  );
}

/** Enumerate synthetic demo routes for Cloudflare static export. */
export function generateStaticParams(): { sessionId: string }[] {
  return DEMO_SESSIONS.map(({ id }) => ({ sessionId: id }));
}
