/**
 * RankChange — shows a green ↑ or red ↓ arrow with the change value.
 * change: string like "+3", "-1", or "-" / null for no change.
 */
interface RankChangeProps {
  change: string | number | null | undefined
}

export default function RankChange({ change }: RankChangeProps) {
  if (!change || change === '-' || change === '0') {
    return <span className="rank-same">–</span>
  }
  const val = String(change)
  const num = parseInt(val)
  if (isNaN(num)) return <span className="rank-same">–</span>

  if (num > 0) {
    return <span className="rank-up">▲ {Math.abs(num)}</span>
  }
  return <span className="rank-down">▼ {Math.abs(num)}</span>
}
