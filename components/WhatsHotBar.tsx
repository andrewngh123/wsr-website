import Link from 'next/link'
import { WHATS_HOT, WHATS_HOT_ENABLED, type HotItem } from '@/lib/whatsHot'

// How many times the headline list is repeated inside the track. The animation
// shifts the track by exactly one copy's width (-100/REPEAT %), so copy N lands
// where copy N-1 started and the loop is seamless. 4 copies also keeps the bar
// full on very wide screens.
const REPEAT = 4

// Scroll speed, in characters per second — the pace the text reads at.
const CHARS_PER_SECOND = 11

function Headline({ item }: { item: HotItem }) {
  const body = <span className="whitespace-nowrap">{item.text}</span>
  return (
    <span className="flex items-center shrink-0">
      {item.href
        ? <Link href={item.href} className="whitespace-nowrap hover:text-wsr-accent hover:underline underline-offset-4 transition-colors">{item.text}</Link>
        : body}
      {/* separator between headlines */}
      <span aria-hidden="true" className="mx-6 text-wsr-accent/70 select-none">◆</span>
    </span>
  )
}

export default function WhatsHotBar({ className = '' }: { className?: string }) {
  if (!WHATS_HOT_ENABLED || WHATS_HOT.length === 0) return null

  // One copy's length drives the duration, so a longer headline scrolls for
  // longer instead of racing past.
  const chars = WHATS_HOT.reduce((n, i) => n + i.text.length + 4, 0)
  const duration = Math.max(18, Math.round(chars / CHARS_PER_SECOND))

  return (
    <div
      className={`wsr-ticker bg-wsr-blue text-white text-[13px] flex items-stretch overflow-hidden rounded-xl shadow-lg ring-1 ring-wsr-accent/25 ${className}`}
      role="region"
      aria-label="What's hot — latest update"
    >
      {/* Fixed label, like a TV lower-third */}
      <div className="shrink-0 flex items-center gap-2 bg-wsr-accent text-wsr-navy font-extrabold uppercase tracking-wider text-[11px] px-3 sm:px-4 py-2">
        <span className="wsr-ticker-dot h-1.5 w-1.5 rounded-full bg-wsr-navy" aria-hidden="true" />
        What&apos;s Hot
      </div>

      {/* Scrolling headlines */}
      <div className="wsr-ticker-viewport relative flex-1 min-w-0 overflow-hidden">
        <div
          className="wsr-ticker-track py-2"
          style={{
            ['--wsr-ticker-duration' as string]: `${duration}s`,
            ['--wsr-ticker-shift' as string]: `${-100 / REPEAT}%`,
          }}
        >
          {Array.from({ length: REPEAT }).map((_, copy) => (
            // Only the first copy is read aloud; the rest are visual padding.
            <span key={copy} className="flex items-center shrink-0" aria-hidden={copy > 0 || undefined}>
              {WHATS_HOT.map((item, i) => <Headline key={i} item={item} />)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
