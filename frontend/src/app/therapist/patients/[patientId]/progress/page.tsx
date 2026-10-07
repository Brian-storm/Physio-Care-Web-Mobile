/* PhysioCare — Therapist progress-report placeholder. Expected result: show the demo patient's session history, measured trend, and human-review signals. */

import Link from 'next/link';
import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { Alert, Badge, Table, TableCell, TableHead } from '@/components/ui';
import { DEMO_PATIENT, DEMO_PROGRESS, findDemoPatient, formatDemoDate } from '@/data/phase1DemoData';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';

export interface TherapistProgressPageProps {
  params: { patientId: string };
}

/**
 * Render a trend view and chronological records for the selected demo patient.
 *
 * @param props - The route's patient identifier.
 * @returns A progress report or a clear patient-not-found state.
 */
export default function TherapistProgressPage({ params }: TherapistProgressPageProps): React.JSX.Element {
  const patient = findDemoPatient(params.patientId);

  if (!patient) {
    return (
      <Phase1PortalShell role="therapist" activeHref={PHASE1_ROUTES.therapistPatients}>
        <Alert tone="warning" title="無法顯示進度報告">這份示範報告沒有對應的患者資料。</Alert>
        <Link href={PHASE1_ROUTES.therapistPatients} className="mt-5 inline-flex text-pc-14 font-semibold text-primary-800 underline underline-offset-4">返回患者名單</Link>
      </Phase1PortalShell>
    );
  }

  const chartPoints = DEMO_PROGRESS.sessions
    .map((session, index) => `${24 + index * 110},${176 - session.averageFormScore * 1.35}`)
    .join(' ');

  return (
    <Phase1PortalShell role="therapist" activeHref={PHASE1_ROUTES.therapistProgress(patient.id)}>
      <div className="grid gap-8">
        <section>
          <Badge variant="primary">進度報告 · Progress report</Badge>
          <h1 className="mt-4 text-pc-36 font-bold leading-tight">{patient.name} 的訓練趨勢</h1>
          <p className="mt-3 max-w-3xl text-pc-16 leading-relaxed text-ink-muted">按時間查看椅子深蹲測量與患者回報，留意值得人工檢視的變化。</p>
        </section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section className="bg-surface p-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-pc-20 font-semibold">動作品質變化</h2><p className="mt-1 text-pc-14 text-ink-muted">{DEMO_PROGRESS.totalSessions} 次訓練 · 趨勢改善</p></div>
              <Badge variant="success">持續進步</Badge>
            </div>
            <svg viewBox="0 0 390 200" role="img" aria-label="四次訓練的動作品質分數呈上升趨勢" className="mt-6 h-52 w-full">
              <path d="M20 178H370" fill="none" stroke="var(--pc-neutral-200)" strokeWidth="1" />
              <polyline points={chartPoints} fill="none" stroke="var(--pc-primary-600)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              {DEMO_PROGRESS.sessions.map((session, index) => (
                <circle key={session.id} cx={24 + index * 110} cy={176 - session.averageFormScore * 1.35} r="5" fill="var(--pc-primary-700)" />
              ))}
            </svg>
            <div className="grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
              <div><p className="text-pc-13">總訓練</p><strong className="text-pc-20">{DEMO_PROGRESS.totalSessions}</strong></div>
              <div><p className="text-pc-13">總次數</p><strong className="text-pc-20">{DEMO_PROGRESS.totalReps}</strong></div>
              <div><p className="text-pc-13">平均品質</p><strong className="text-pc-20">{DEMO_PROGRESS.averageFormScore}</strong></div>
              <div><p className="text-pc-13">已標記</p><strong className="text-pc-20">{DEMO_PROGRESS.flaggedSessions}</strong></div>
            </div>
          </section>
          <aside>
            <h2 className="mb-4 text-pc-20 font-semibold">需要人工檢視</h2>
            {DEMO_PROGRESS.sessions.filter((session) => session.flagged).map((session) => (
              <Alert key={session.id} tone="warning" className="mb-4" title="動作訊號">
                {session.flagReason} 分數與訊號需由治療師結合訓練脈絡判斷。
              </Alert>
            ))}
            <p className="text-pc-13 leading-relaxed text-ink-muted">趨勢只呈現測量變化，不會自動診斷、調整目標或提供治療處方。</p>
            <Link href={PHASE1_ROUTES.therapistPatient(patient.id)} className="mt-5 inline-flex text-pc-14 font-semibold text-primary-800 underline underline-offset-4">返回患者概覽</Link>
          </aside>
        </div>
        <section>
          <h2 className="mb-5 text-pc-20 font-semibold">訓練紀錄</h2>
          <Table aria-label="患者訓練紀錄">
            <thead><tr><TableHead>日期</TableHead><TableHead>完成次數</TableHead><TableHead>動作品質</TableHead><TableHead>最高風險</TableHead><TableHead>疼痛自評</TableHead><TableHead>狀態</TableHead></tr></thead>
            <tbody>{DEMO_PROGRESS.sessions.slice().reverse().map((session) => (
              <tr key={session.id}>
                <TableCell>{formatDemoDate(session.startedAt)}</TableCell>
                <TableCell>{session.repsCompleted} / 10</TableCell>
                <TableCell>{session.averageFormScore} / 100</TableCell>
                <TableCell>{session.maximumDangerScore} / 100</TableCell>
                <TableCell>{session.painScore} / 10</TableCell>
                <TableCell>{session.flagged ? <Badge variant="warning">需留意</Badge> : <Badge variant="success">一般</Badge>}</TableCell>
              </tr>
            ))}</tbody>
          </Table>
        </section>
      </div>
    </Phase1PortalShell>
  );
}

/** Enumerate synthetic demo routes for Cloudflare static export. */
export function generateStaticParams(): { patientId: string }[] {
  return [{ patientId: DEMO_PATIENT.id }];
}
