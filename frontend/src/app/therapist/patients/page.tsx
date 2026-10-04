/* PhysioCare — Therapist patient-check list placeholder. Expected result: display the demo patient, latest activity, movement status, and a direct patient-report link. */

import Link from 'next/link';
import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { Badge, Table, TableCell, TableHead } from '@/components/ui';
import { DEMO_PATIENT, DEMO_PROGRESS, DEMO_SESSIONS, formatDemoDate } from '@/data/phase1DemoData';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';

/**
 * Render the therapist patient list using the synthetic Phase 1 demo record.
 *
 * @returns A patient-check table with recent activity and review status.
 */
export default function TherapistPatientsPage(): React.JSX.Element {
  const latestSession = DEMO_SESSIONS[DEMO_SESSIONS.length - 1];

  return (
    <Phase1PortalShell role="therapist" activeHref={PHASE1_ROUTES.therapistPatients}>
      <div className="grid gap-8">
        <section>
          <p className="text-pc-14 font-semibold text-primary-800">治療師工作區 · Therapist workspace</p>
          <h1 className="mt-2 text-pc-36 font-bold leading-tight">患者概況</h1>
          <p className="mt-3 max-w-3xl text-pc-16 leading-relaxed text-ink-muted">
            先查看最近活動與需要留意的訓練，再開啟患者進度報告。
          </p>
        </section>
        <section aria-labelledby="patient-list-title">
          <h2 id="patient-list-title" className="mb-5 text-pc-20 font-semibold">患者名單</h2>
          <Table aria-label="治療師患者名單">
            <thead>
              <tr>
                <TableHead>患者</TableHead>
                <TableHead>復健目標</TableHead>
                <TableHead>最近訓練</TableHead>
                <TableHead>動作品質</TableHead>
                <TableHead>檢視狀態</TableHead>
                <TableHead><span className="sr-only">開啟患者</span></TableHead>
              </tr>
            </thead>
            <tbody>
              <tr>
                <TableCell><strong>{DEMO_PATIENT.name}</strong></TableCell>
                <TableCell>{DEMO_PATIENT.rehabGoal}</TableCell>
                <TableCell>{latestSession.repsCompleted} / 10 次 · {formatDemoDate(latestSession.startedAt)}</TableCell>
                <TableCell>{DEMO_PROGRESS.averageFormScore} / 100</TableCell>
                <TableCell>{latestSession.flagged ? <Badge variant="warning">需留意 1 次</Badge> : <Badge variant="success">趨勢穩定</Badge>}</TableCell>
                <TableCell><Link href={PHASE1_ROUTES.therapistPatient(DEMO_PATIENT.id)} className="font-semibold text-primary-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500">查看患者</Link></TableCell>
              </tr>
            </tbody>
          </Table>
          <p className="mt-4 text-pc-13 text-ink-muted">示範資料為虛構；目前列表不會讀取或儲存後端資料。</p>
        </section>
      </div>
    </Phase1PortalShell>
  );
}
