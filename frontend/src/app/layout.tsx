/* PhysioCare — Root layout with metadata and global styles */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PhysioCare — Smart Rehabilitation Platform',
  description:
    'AI-powered physiotherapy assistant with real-time pose tracking, form analysis, and progress monitoring for patients and therapists.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}