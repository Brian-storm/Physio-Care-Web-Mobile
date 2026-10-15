/* PhysioCare — Patient personal profile page displaying comprehensive fixture data. */

import { Phase1PortalShell } from '@/components/layout/Phase1PortalShell';
import { Badge, ScoreBar } from '@/components/ui';
import { PHASE1_ROUTES } from '@/constants/phase1Routes';
import { DEMO_EXERCISE, DEMO_PATIENT, DEMO_PROGRESS, DEMO_SESSIONS, formatDemoDate } from '@/data/phase1DemoData';
import Link from 'next/link';

export default function PatientProfilePage(): React.JSX.Element {
  const sortedSessions = [...DEMO_SESSIONS].reverse();

  return (
    <Phase1PortalShell role="patient" activeHref={PHASE1_ROUTES.patientHome}>
      <div className="grid gap-8">
        {/* Identifying Information Section */}
        <section className="bg-surface p-card rounded-xl border border-line shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-pc-14 font-semibold text-primary-800">患者個人檔案 · Patient Profile</span>
              <h1 className="mt-2 text-pc-36 font-bold text-ink">{DEMO_PATIENT.name}</h1>
            </div>
          </div>
          
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 border-t border-line pt-6">
            <div>
              <dt className="text-pc-14 text-ink-muted">主治治療師</dt>
              <dd className="mt-1 text-pc-16 font-semibold text-ink">{DEMO_PATIENT.therapistName}</dd>
            </div>
            <div>
              <dt className="text-pc-14 text-ink-muted">核心復健目標</dt>
              <dd className="mt-1 text-pc-16 font-semibold text-ink">{DEMO_PATIENT.rehabGoal}</dd>
            </div>
            <div>
              <dt className="text-pc-14 text-ink-muted">每週目標訓練次數</dt>
              <dd className="mt-1 text-pc-16 font-semibold text-ink">{DEMO_PATIENT.weeklyTargetSessions} 次 / 週</dd>
            </div>
          </dl>
        </section>

        {/* Assigned Exercise & Clinical Goals */}
        <section className="bg-surface p-card rounded-xl border border-line shadow-panel" aria-labelledby="assigned-exercise-title">
          <h2 id="assigned-exercise-title" className="text-pc-20 font-semibold text-ink">目前指定動作</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-line pt-4">
            <div>
              <span className="text-pc-14 text-ink-muted">動作名稱</span>
              <p className="mt-1 text-pc-16 font-semibold text-ink">{DEMO_EXERCISE.name}</p>
            </div>
            <div>
              <span className="text-pc-14 text-ink-muted">臨床目標</span>
              <p className="mt-1 text-pc-16 font-semibold text-ink">{DEMO_EXERCISE.clinicalGoal}</p>
            </div>
            <div>
              <span className="text-pc-14 text-ink-muted">目標組數與次數</span>
              <p className="mt-1 text-pc-16 font-semibold text-ink">{DEMO_EXERCISE.targetSets} 組 × {DEMO_EXERCISE.targetReps} 次</p>
            </div>
            <div>
              <span className="text-pc-14 text-ink-muted">安全提示</span>
              <p className="mt-1 text-pc-14 text-warning-800">{DEMO_EXERCISE.safetyNote}</p>
            </div>
          </div>
          <p className="mt-4 text-pc-14 text-ink-muted bg-primary-50 p-3 rounded-sm">
            動作描述：{DEMO_EXERCISE.description}
          </p>
        </section>

        {/* Aggregated Progress Metrics */}
        <section className="bg-surface p-card rounded-xl border border-line shadow-panel" aria-labelledby="metrics-title">
          <h2 id="metrics-title" className="text-pc-20 font-semibold text-ink">累積進度與表現統計</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <span className="text-pc-14 text-ink-muted">總訓練次數</span>
              <p className="mt-2 text-pc-30 font-bold text-primary-800 tabular-nums">{DEMO_PROGRESS.totalSessions} <span className="text-pc-16 font-medium">次</span></p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg">
              <span className="text-pc-14 text-ink-muted">累積完成次數（Reps）</span>
              <p className="mt-2 text-pc-30 font-bold text-primary-800 tabular-nums">{DEMO_PROGRESS.totalReps} <span className="text-pc-16 font-medium">下</span></p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg">
              <span className="text-pc-14 text-ink-muted">平均風險分數</span>
              <p className="mt-2 text-pc-30 font-bold text-primary-800 tabular-nums">{DEMO_PROGRESS.averageDangerScore} <span className="text-pc-16 font-medium">/ 100</span></p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg">
              <span className="text-pc-14 text-ink-muted">需要留意紀錄</span>
              <p className="mt-2 text-pc-30 font-bold text-warning-800 tabular-nums">{DEMO_PROGRESS.flaggedSessions} <span className="text-pc-16 font-medium">次</span></p>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <ScoreBar label="歷史平均動作品質總評" value={DEMO_PROGRESS.averageFormScore} />
          </div>
        </section>

        {/* Lowkey Expandable Past Records Section */}
        <section className="bg-surface p-card rounded-xl border border-line shadow-panel" aria-labelledby="history-title">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between text-pc-20 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 rounded-sm">
              <span>歷史訓練紀錄檢視 ({sortedSessions.length} 筆)</span>
              <span className="text-pc-14 font-medium text-primary-800 underline underline-offset-4 group-open:hidden">展開列表</span>
              <span className="text-pc-14 font-medium text-primary-800 underline underline-offset-4 hidden group-open:inline">收起列表</span>
            </summary>
            
            <div className="mt-6 border-t border-line pt-6 grid gap-4">
              {sortedSessions.map((session, index) => (
                <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-neutral-50 border border-line">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-pc-14 font-bold text-ink">紀錄 #{sortedSessions.length - index}</span>
                      <span className="text-pc-13 text-ink-muted">{formatDemoDate(session.startedAt)}</span>
                      {session.flagged && <Badge variant="warning">需留意</Badge>}
                    </div>
                    <p className="mt-1 text-pc-14 text-ink-muted">
                      完成 {session.repsCompleted} 次 · 動作品質：<strong className="text-ink">{session.averageFormScore} 分</strong> · 疼痛自評：{session.painScore}/10
                    </p>
                  </div>
                  <Link 
                    href={PHASE1_ROUTES.patientResult(session.id)}
                    className="text-pc-14 font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-900"
                  >
                    查看詳細測量
                  </Link>
                </div>
              ))}
            </div>
          </details>
        </section>
      </div>
    </Phase1PortalShell>
  );
}