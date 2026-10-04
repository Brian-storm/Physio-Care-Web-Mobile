/* PhysioCare — Therapist patient overview placeholder. Expected result: identify the selected demo patient, show the latest session and review signal, and link to progress. */

import Link from 'next/link';
import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { Alert, Badge } from '@/components/ui';
import { DEMO_PATIENT, DEMO_PROGRESS, DEMO_SESSIONS, findDemoPatient } from '@/data/phase1DemoData';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';

export interface TherapistPatientPageProps {
  params: { patientId: string };
}

/**
 * Render one therapist-facing patient check page using static demo fixtures.
 *
 * @param props - The route's patient identifier.
 * @returns A patient overview or an access/missing-record state.
 */
export default function TherapistPatientPage({ params }: TherapistPatientPageProps): React.JSX.Element {
  const patient = findDemoPatient(params.patientId);

  if (!patient) {
    return (
      <Phase1PortalShell role="therapist" activeHref={PHASE1_ROUTES.therapistPatients}>
        <Alert tone="warning" title="找不到這位示範患者">請回到患者名單選擇可檢視的患者。</Alert>
        <Link href={PHASE1_ROUTES.therapistPatients} className="mt-5 inline-flex text-pc-14 font-semibold text-primary-800 underline underline-offset-4">返回患者名單</Link>
      </Phase1PortalShell>
    );
  }

  const latestSession = DEMO_SESSIONS[DEMO_SESSIONS.length - 1];

  return (
    <Phase1PortalShell role="therapist" activeHref={PHASE1_ROUTES.therapistPatient(patient.id)}>
      <div className="grid gap-8">
        <section>
          <Badge variant="primary">患者概覽 · Patient check</Badge>
          <h1 className="mt-4 text-pc-36 font-bold leading-tight">{patient.name}</h1>
          <p className="mt-3 max-w-3xl text-pc-16 leading-relaxed text-ink-muted">復健目標：{patient.rehabGoal}</p>
        </section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section>
            <h2 className="text-pc-24 font-semibold">最近一次訓練</h2>
            <dl className="mt-3">
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">動作</dt><dd className="text-pc-16 font-semibold">椅子深蹲</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">完成次數</dt><dd className="text-pc-16 font-semibold">{latestSession.repsCompleted} / 10</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">平均動作品質</dt><dd className="text-pc-16 font-semibold">{latestSession.averageFormScore} / 100</dd></div>
              <div className="flex justify-between gap-4 border-b border-line py-4"><dt className="text-pc-14 text-ink-muted">患者不適自評</dt><dd className="text-pc-16 font-semibold">{latestSession.painScore} / 10</dd></div>
            </dl>
            <p className="mt-5 text-pc-13 leading-relaxed text-ink-muted">動作測量與患者回報供專業檢視參考；臨床決定由治療師作出。</p>
          </section>
          <aside className="bg-primary-50 p-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-pc-20 font-semibold">需要留意</h2>
              <Badge variant={latestSession.flagged ? 'warning' : 'success'}>{latestSession.flagged ? '1 次訊號' : '無已標記項目'}</Badge>
            </div>
            <p className="mt-4 text-pc-14 leading-relaxed text-ink-muted">
              {latestSession.flagReason ?? '最近訓練沒有已標記項目。'}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-pc-14">
              <span><strong>{DEMO_PROGRESS.totalSessions}</strong> 次訓練</span>
              <span><strong>{DEMO_PROGRESS.totalReps}</strong> 次動作</span>
            </div>
            <Link href={PHASE1_ROUTES.therapistProgress(patient.id)} className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-primary-700 px-4 text-pc-16 font-semibold text-neutral-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2">開啟進度報告</Link>
          </aside>
        </div>
      </div>
    </Phase1PortalShell>
  );
}
