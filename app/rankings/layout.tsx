import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rankings',
  description: 'Browse the full World Sports Rankings — WRCES, WFCR, WSPI and WRCES Merit — by year and continent.',
  alternates: { canonical: '/rankings' },
}

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
