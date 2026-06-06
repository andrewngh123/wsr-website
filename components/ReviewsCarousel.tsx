'use client'

import { useRef } from 'react'
import ReviewAvatar from './ReviewAvatar'

export type Review = {
  text: string
  name: string
  title: string
  photo: string
  initials: string
}

/**
 * Horizontal reviews carousel with left/right arrow buttons on the sides
 * (swipe on touch devices). Cards are equal-width and snap into place.
 */
export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollByDir = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })

  return (
    <div className="relative sm:px-12">
      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto pb-3 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r, i) => (
          <div
            key={i}
            className="snap-start shrink-0 w-[19rem] sm:w-[22rem] bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col"
          >
            <p className="text-gray-600 text-sm italic leading-relaxed mb-6 flex-1">&ldquo;{r.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <ReviewAvatar photo={r.photo} name={r.name} initials={r.initials} />
              <div>
                <p className="font-semibold text-wsr-navy text-sm">{r.name}</p>
                <p className="text-gray-400 text-xs">{r.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side arrows */}
      <button
        type="button"
        aria-label="Previous reviews"
        onClick={() => scrollByDir(-1)}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-wsr-navy text-xl leading-none hover:bg-gray-50"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next reviews"
        onClick={() => scrollByDir(1)}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-wsr-navy text-xl leading-none hover:bg-gray-50"
      >
        ›
      </button>
    </div>
  )
}
