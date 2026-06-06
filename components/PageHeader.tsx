import React from 'react'

/**
 * Shared page header for non-home pages. A navy band with a faint stadium
 * photo, floodlight glow, light particles and a gold accent line — cohesive
 * with the homepage hero but lighter, and keeps text fully readable.
 *
 * Pass `title` (+ optional `subtitle`) for the standard centered header, or
 * `children` for a custom layout (e.g. the country page's flag + name).
 */
export default function PageHeader({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-wsr-navy text-white">
      {/* faint stadium photo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: 'url(/design/hero-stadium.webp)' }}
      />
      {/* navy wash — keeps the text crisp over the photo */}
      <div className="absolute inset-0 bg-gradient-to-br from-wsr-navy via-wsr-navy/90 to-[#0b1c3d]/85" />
      {/* light particles */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-screen bg-cover bg-center"
        style={{ backgroundImage: 'url(/design/particles.webp)' }}
      />
      {/* floodlight glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 100% at 50% -30%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(60% 80% at 90% 130%, rgba(31,107,255,0.30), transparent 60%)',
        }}
      />
      {/* gold accent line at the bottom edge */}
      <div
        className="absolute bottom-0 inset-x-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent, #e8a020aa, transparent)' }}
      />

      <div className="relative px-4 py-14">
        {title && (
          <div className="text-center">
            <h1 className="text-3xl font-extrabold">{title}</h1>
            {subtitle && <p className="text-white/70 text-sm mt-2 max-w-xl mx-auto">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
