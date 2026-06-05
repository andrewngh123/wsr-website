'use client'

/**
 * RankingLogo — renders a ranking's logo image and quietly hides it if the
 * remote SVG fails to load. Client component because it uses an onError handler.
 */
interface RankingLogoProps {
  src: string
  alt: string
}

export default function RankingLogo({ src, alt }: RankingLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-12 object-contain"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
