/* PhysioCare — Root layout with metadata and global styles. Expected result: every route renders with the approved bilingual Kinetic Atlas token system. */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PhysioCare — Smart Rehabilitation Platform',
  description:
    'AI-powered physiotherapy assistant with real-time pose tracking, form analysis, and progress monitoring for patients and therapists.',
};

/**
 * Render shared metadata, locale, global tokens, and route content.
 *
 * @param props - Child route content supplied by the Next.js App Router.
 * @returns The root HTML document for the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
