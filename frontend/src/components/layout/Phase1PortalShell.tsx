/* PhysioCare — Shared Phase 1 portal shell. Expected result: consistent patient/therapist navigation that links all frontend-only demo routes. */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { DEMO_PATIENT_ID, DEMO_SESSION_ID, PHASE1_ROUTES } from '@/constants/phase1Routes';
import type { Phase1Role, Phase1NavItem } from '@/types/phase1';
import { NavLink } from '@/components/ui';

export interface Phase1PortalShellProps {
  role: Phase1Role;
  activeHref: string;
  children: ReactNode;
}

const navByRole: Record<Phase1Role, Phase1NavItem[]> = {
  patient: [
    { label: '今日概況', href: PHASE1_ROUTES.patientHome },
    { label: '準備訓練', href: PHASE1_ROUTES.sessionSetup },
    { label: '最近結果', href: PHASE1_ROUTES.patientResult(DEMO_SESSION_ID) },
  ],
  therapist: [
    { label: '患者名單', href: PHASE1_ROUTES.therapistPatients },
    { label: '患者概覽', href: PHASE1_ROUTES.therapistPatient(DEMO_PATIENT_ID) },
    { label: '進度報告', href: PHASE1_ROUTES.therapistProgress(DEMO_PATIENT_ID) },
  ],
};

/**
 * Render shared product navigation around one Phase 1 role workspace.
 *
 * @param props - Active role, current route, and page content.
 * @returns A responsive header, role navigation, and main content region.
 */
export function Phase1PortalShell({
  role,
  activeHref,
  children,
}: Phase1PortalShellProps): React.JSX.Element {
  const roleLabel = role === 'patient' ? '患者 Patient' : '治療師 Physiotherapist';

  return (
    <div className="min-h-screen bg-surface-page text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-page py-5">
          <Link href={PHASE1_ROUTES.entry} className="flex items-center gap-3 text-pc-20 font-bold text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary-600" />
            PhysioCare
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-pc-14 text-ink-muted">{roleLabel} · 示範模式 Demo</span>
            <Link href={PHASE1_ROUTES.entry} className="text-pc-14 font-semibold text-primary-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500">
              切換工作區
            </Link>
          </div>
        </div>
      </header>
      <nav aria-label={role === 'patient' ? '患者主要導覽' : '治療師主要導覽'} className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-page py-3">
        {navByRole[role].map((item) => (
          <NavLink key={item.href} href={item.href} current={activeHref === item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto w-full max-w-6xl px-page py-section">{children}</main>
    </div>
  );
}
