import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SITE_INDEXABLE, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'World Sports Rankings — The First Scientific Index Ranking All Countries in Sport',
    template: '%s | World Sports Rankings',
  },
  description: 'World Sports Rankings (WSR) — the first scientific index ranking all 206 countries in elite sport, via the WRCES, WFCR, WSPI and Merit rankings.',
  // Hidden from search engines until the site moves to its permanent domain.
  // Controlled by SITE_INDEXABLE in lib/seo.ts.
  robots: SITE_INDEXABLE
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'World Sports Rankings',
    description: 'The first scientific index ranking all countries in sport.',
    url: SITE_URL,
    siteName: 'World Sports Rankings',
    images: ['/design/hero-stadium.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Sports Rankings',
    description: 'The first scientific index ranking all countries in sport.',
    images: ['/design/hero-stadium.webp'],
  },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'World Sports Rankings',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-w.svg`,
  sameAs: [
    'https://www.facebook.com/profile.php?id=61559658500068',
    'https://www.instagram.com/worldsportsrankings/',
    'https://www.linkedin.com/company/world-ranking-of-countries-in-elite-sports/',
    'https://x.com/WSRankings',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
