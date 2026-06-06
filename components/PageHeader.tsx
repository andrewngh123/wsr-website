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
      {/* sport photo (varies per page), faded into the navy — same treatment as the home hero */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      {/* navy gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-wsr-navy/95 via-wsr-navy/80 to-[#0b1c3d]/60" />
      {/* light particles */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-screen bg-cover bg-center"
        style={{ backgroundImage: 'url(/design/particles.webp)' }}
      />
      {/* stadium-floodlight glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -15%, rgba(255,255,255,0.20), transparent 55%), radial-gradient(70% 60% at 85% 115%, rgba(31,107,255,0.22), transparent 60%)',
        }}
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
