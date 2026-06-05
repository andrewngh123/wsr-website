import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Media Release — World Sports Rankings',
}

// ── Add media releases here — no code knowledge needed ───────────────────────
const RELEASES = [
  // Example entry:
  // {
  //   date: '2025-06-01',
  //   title: 'WSR Releases 2025 Annual Rankings',
  //   summary: 'USA leads the 2025 WRCES with a record-breaking score...',
  //   link: '',   // optional: URL to full press release PDF or page
  // },
]
// ─────────────────────────────────────────────────────────────────────────────

export default function MediaReleasePage() {
  return (
    <div className="min-h-screen">
      <div className="bg-wsr-navy text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-extrabold">Media Release</h1>
        <p className="text-white/60 text-sm mt-2">Official press releases and announcements</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">
        {RELEASES.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No media releases yet. Check back soon.</p>
        ) : (
          <div className="space-y-6">
            {RELEASES.map((r: any, i: number) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">{r.date}</p>
                <h3 className="font-semibold text-wsr-navy leading-snug mb-2">{r.title}</h3>
                {r.summary && <p className="text-sm text-gray-600">{r.summary}</p>}
                {r.link && (
                  <a href={r.link} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs text-wsr-blue hover:underline">
                    Read full release →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-wsr-blue hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
