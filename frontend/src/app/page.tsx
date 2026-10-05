/* PhysioCare — Phase 1 role entry. Expected result: route patients and physiotherapists into their linked static demo workspaces. */

import Link from 'next/link';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';
import { MovementTrace } from '@/components/patient/MovementTrace';
import { DEMO_PATIENT } from '@/data/phase1DemoData';

/**
 * Render the Phase 1 workspace chooser and product introduction.
 *
 * @returns A role-entry page with direct patient and therapist routes.
 */
export default function HomePage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-surface-page text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-page py-5">
        <div className="flex items-center gap-3 text-pc-20 font-bold">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary-600" />
          PhysioCare
        </div>
        <span className="text-pc-14 text-ink-muted">居家復健 · Home rehabilitation</span>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-page py-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <section>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-ink">
            讓動作更穩，從每一次練習開始。
          </h1>
          <p className="mt-5 max-w-2xl text-pc-18 leading-relaxed text-ink-muted">
            PhysioCare 在家中即時測量動作，讓患者與治療師都能看見訓練進度。姿勢分析在裝置端進行，影片不會離開鏡頭所在的裝置。
          </p>
          <MovementTrace
            title="動作成為復健進度的證據"
            description="人體姿勢與移動路徑示意；訓練結果仍由治療師檢視。"
          />
        </section>
        <section aria-labelledby="workspace-title" className="grid gap-6">
          <h2 id="workspace-title" className="text-pc-24 font-semibold">選擇工作區 Choose a workspace</h2>
          <div className="bg-surface p-card">
            <h3 className="text-pc-20 font-semibold">患者 Patient</h3>
            <p className="mt-2 text-pc-14 leading-relaxed text-ink-muted">
              {DEMO_PATIENT.name}，查看今日訓練目標、開始動作分析並檢視結果。
            </p>
            <Link
              href={PHASE1_ROUTES.patientHome}
              className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-primary-700 px-4 text-pc-16 font-semibold text-neutral-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2"
            >
              進入患者入口
            </Link>
          </div>
          <div className="bg-primary-50 p-card">
            <h3 className="text-pc-20 font-semibold">物理治療師 Physiotherapist</h3>
            <p className="mt-2 text-pc-14 leading-relaxed text-ink-muted">
              查看患者最近訓練、動作測量與進度報告。
            </p>
            <Link
              href={PHASE1_ROUTES.therapistPatients}
              className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-primary-700 px-4 text-pc-16 font-semibold text-neutral-50 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2"
            >
              進入治療師工作區
            </Link>
          </div>
          <p className="text-pc-13 leading-relaxed text-ink-muted">
            示範模式使用虛構資料；目前未連接登入、資料庫或後端 API。
          </p>
        </section>
      </div>
    </main>
  );
}
