'use client'

import { useState } from 'react'

/**
 * Reviewer avatar: shows the photo, and if it fails to load (or is missing)
 * falls back to a circle with the reviewer's initials. Client component
 * because it needs an onError handler.
 */
export default function ReviewAvatar({
  photo,
  name,
  initials,
}: {
  photo: string
  name: string
  initials: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="w-10 h-10 rounded-full bg-wsr-blue text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-wsr-light">
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt={name}
      className="w-10 h-10 rounded-full object-cover ring-2 ring-wsr-light flex-shrink-0"
      onError={() => setFailed(true)}
    />
  )
}
