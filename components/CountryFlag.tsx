/**
 * CountryFlag — renders a small country flag using flagcdn.com (free, no API key).
 * iso2: two-letter ISO country code (e.g. "us", "fr", "gb")
 */
interface CountryFlagProps {
  iso2: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'h-4 w-6', md: 'h-5 w-8', lg: 'h-6 w-9' }

export default function CountryFlag({ iso2, name = '', size = 'sm' }: CountryFlagProps) {
  const code = iso2.toLowerCase()
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={name ? `Flag of ${name}` : code.toUpperCase()}
      className={`${sizeMap[size]} object-cover rounded-sm shadow-sm`}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
