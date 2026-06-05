'use client'

import { useRef } from 'react'

/**
 * Horizontal, swipeable carousel row with left/right scroll arrows (shown on
 * larger screens). Children are the cards; on touch devices users just swipe.
 */
export default function MediaCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollByDir = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-3 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByDir(-1)}
        className="hidden md:flex absolute -left-3 top-[7.5rem] -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-wsr-navy text-xl leading-none hover:bg-gray-50"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByDir(1)}
        className="hidden md:flex absolute -right-3 top-[7.5rem] -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-wsr-navy text-xl leading-none hover:bg-gray-50"
      >
        ›
      </button>
    </div>
  )
}
