'use client'

import { useState } from 'react'

/**
 * Shows an article's preview image, falling back to a branded gradient panel
 * (with the source name) if there's no image or it fails to load. Client
 * component because it needs an onError handler.
 */
export default function MediaImage({ src, source }: { src?: string; source: string }) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <div className="aspect-[16/9] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className="aspect-[16/9] bg-gradient-to-br from-wsr-navy to-wsr-blue flex items-center justify-center">
      <span className="text-white/90 font-bold text-lg tracking-wide px-4 text-center">{source}</span>
    </div>
  )
}
