import React from 'react'

/**
 * Shared header for non-home pages. A track-and-field photo (athletics lane
 * lines — distinct from the home page's stadium) under a navy wash, with a
 * floodlight glow and a gold accent line. The white lane lines read through
 * the wash for a sporty feel while keeping the title fully legible.
 *
 * Pass `title` (+ optional `subtitle`) for the standard centered header, or
 * `children` for a custom layout (e.g. the country page's flag + name).
 */
export default function PageHeader({
  title,
  subtitle,
  bg = '/design/headers/athletics.webp',
  children,
}: {
  title?: string
  subtitle?: React.ReactNode
  bg?: string
  children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-wsr-navy text-white">
      {/* sport photo (varies per page) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      {/* navy wash — keeps the title legible while the photo shows through */}
      <div className="absolute inset-0 bg-gradient-to-r from-wsr-navy/92 via-wsr-navy/78 to-wsr-navy/62" />
      {/* electric floodlight glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(100% 130% at 85% -25%, rgba(31,107,255,0.32), transparent 55%)' }}
      />
      {/* gold accent line at the bottom edge */}
      <div
        className="absolute bottom-0 inset-x-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent, #e8a020cc, transparent)' }}
      />

      <div className="relative px-4 py-16">
        {title && (
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-sm">{title}</h1>
            {subtitle && <p className="text-white/75 text-sm mt-2 max-w-xl mx-auto">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
