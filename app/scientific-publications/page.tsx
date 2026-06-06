import { Metadata } from 'next'
import Link from 'next/link'
import { PUBLICATIONS } from '@/lib/publications'

export const metadata: Metadata = {
  title: 'Scientific Publications',
  description: 'Peer-reviewed papers, books and conference proceedings behind the World Sports Rankings methodology.',
  alternates: { canonical: '/scientific-publications' },
}

export default function ScientificPublicationsPage() {
  const total = PUBLICATIONS.reduce((n, s) => n + s.items.length, 0)

  return (
    <div className="min-h-screen bg-wsr-light">
      <div className="bg-wsr-navy text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-extrabold">Scientific Publications</h1>
        <p className="text-white/60 text-sm mt-2">
          Peer-reviewed research behind the WSR methodology — {total} publications
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        {PUBLICATIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="flex items-center gap-2 text-xl font-bold text-wsr-navy border-b-2 border-wsr-accent/40 pb-2 mb-4">
              <span className="text-2xl leading-none">{section.icon}</span>
              <span>{section.heading}</span>
              <span className="text-gray-400 text-sm font-normal ml-1">({section.items.length})</span>
            </h2>

            <ul className="space-y-3">
              {section.items.map((pub, i) => (
                <li key={i} className="flex items-start gap-3 rounded p-2 transition-colors hover:bg-white/60">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-wsr-blue shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {pub.citation}
                    {pub.link && (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-wsr-blue hover:underline font-medium whitespace-nowrap"
                      >
                        <span className="text-xs">🔗</span>
                        <span>Link</span>
                      </a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="text-center pt-2">
          <Link href="/" className="text-sm text-wsr-blue hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
