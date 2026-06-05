import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Scientific Publications — World Sports Rankings',
}

// ── Add publications here — no code knowledge needed ─────────────────────────
type Publication = {
  title: string
  authors: string
  year: string
  journal?: string
  link?: string  // optional: DOI or URL
}

const PUBLICATIONS: Publication[] = [
  {
    title: 'World Ranking of Countries in Elite Sport (WRCES) — Methodology and Results',
    authors: 'Nassif, N.',
    year: '2023',
    journal: 'International Journal of Sport Policy and Politics',
    link: '',  // Add DOI or URL when available
  },
  // Add more publications below this line following the same format
]
// ─────────────────────────────────────────────────────────────────────────────

export default function ScientificPublicationsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-wsr-navy text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-extrabold">Scientific Publications</h1>
        <p className="text-white/60 text-sm mt-2">Peer-reviewed research behind the WSR methodology</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">
        {PUBLICATIONS.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Publications coming soon.</p>
        ) : (
          <div className="space-y-6">
            {PUBLICATIONS.map((pub, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <p className="font-semibold text-wsr-navy leading-snug mb-1">
                  {pub.link
                    ? <a href={pub.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{pub.title}</a>
                    : pub.title
                  }
                </p>
                <p className="text-sm text-gray-500">{pub.authors} ({pub.year})</p>
                {pub.journal && <p className="text-xs text-gray-400 mt-1 italic">{pub.journal}</p>}
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
