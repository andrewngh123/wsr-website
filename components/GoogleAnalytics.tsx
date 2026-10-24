'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { SITE_URL } from '@/lib/seo'

const GA_ID = 'G-DS71J9EW4R'

/**
 * Google Analytics 4 (runs alongside Vercel Web Analytics).
 *
 * Only loads on the live domain, so local dev and Vercel preview deploys don't
 * pollute the reports. Also skipped on noindex pages — that's the hidden admin,
 * whose secret URL must never be sent to Google.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const live = window.location.hostname === new URL(SITE_URL).hostname
    const noindex = document.querySelector('meta[name="robots"][content*="noindex"]')
    setEnabled(live && !noindex)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  )
}
