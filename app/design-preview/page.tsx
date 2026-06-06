import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Design Preview — WSR',
  robots: { index: false, follow: false },
}

// Sample data (2026 provisional top 8) just to show the table treatment
const SAMPLE = [
  { rank: 1, name: 'USA',          iso: 'us', points: 299711.63, change: null },
  { rank: 2, name: 'ITALY',        iso: 'it', points: 143635.83, change: '+3' },
  { rank: 3, name: 'CANADA',       iso: 'ca', points: 139975.77, change: '-1' },
  { rank: 4, name: 'CHINA',        iso: 'cn', points: 132134.12, change: '+1' },
  { rank: 5, name: 'AUSTRALIA',    iso: 'au', points: 121322.50, change: '-2' },
  { rank: 6, name: 'GREAT BRITAIN', iso: 'gb', points: 118903.10, change: null },
  { rank: 7, name: 'FRANCE',       iso: 'fr', points: 112540.44, change: '+2' },
  { rank: 8, name: 'JAPAN',        iso: 'jp', points: 104221.07, change: '-1' },
]

const ELECTRIC = '#1F6BFF'
const GOLD = '#e8a020'

function Change({ change }: { change: string | null }) {
  if (!change) return <span className="text-gray-300 text-xs">—</span>
  const up = change.startsWith('+')
  return (
    <span className={`text-xs font-semibold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
      {up ? '▲' : '▼'} {change.replace(/[+-]/, '')}
    </span>
  )
}

export default function DesignPreview() {
  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      <div className="bg-amber-100 text-amber-900 text-center text-xs py-2 px-4 font-medium">
        🎨 Design preview — this page is just a sample for your review. Your live pages are unchanged.
      </div>

      {/* Sample sticky nav */}
      <header className="bg-wsr-navy/95 backdrop-blur sticky top-0 z-40 border-b border-white/10">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo-w.svg" alt="WSR" className="h-8 w-auto" />
          <ul className="hidden md:flex items-center gap-7 text-sm text-white/80">
            {['Home', 'About', 'Rankings', 'Publications', 'Media'].map((l) => (
              <li key={l} className="relative py-1 hover:text-white cursor-pointer after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#1F6BFF] hover:after:w-full after:transition-all">
                {l}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 text-white/60 text-xs">FB · IG · IN · X</div>
        </nav>
      </header>

      {/* ── HERO: stadium bg + futuristic overlay ───────────────────────── */}
      <section className="relative overflow-hidden">
        {/* stadium photo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/design/hero-stadium.webp)' }}
        />
        {/* navy gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-wsr-navy/95 via-wsr-navy/80 to-[#0b1c3d]/60" />
        {/* particle / tech overlay */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: 'url(/design/particles.webp)' }}
        />
        {/* stadium-floodlight glow (replaces the techy grid) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -15%, rgba(255,255,255,0.20), transparent 55%), radial-gradient(70% 60% at 85% 115%, rgba(31,107,255,0.22), transparent 60%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-28 text-center text-white">
          <span
            className="inline-block text-xs font-semibold tracking-[0.25em] uppercase mb-5 px-3 py-1 rounded-full border"
            style={{ color: GOLD, borderColor: GOLD + '66', background: GOLD + '14' }}
          >
            The Science of Sport
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.1] mb-5">
            The <span style={{ color: ELECTRIC }}>First Scientific Index</span><br />
            Ranking Every Country in Sport
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
            Research-based rankings of all 206 nations — updated yearly by the
            International Center for Sport Policy &amp; Governance.
          </p>

          {/* glassy search */}
          <div className="flex max-w-xl mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <input
              placeholder="Search for a country…"
              className="flex-1 px-5 py-4 text-sm text-gray-900 outline-none bg-white/95"
            />
            <button
              className="px-7 py-4 font-semibold text-sm text-white transition-all hover:brightness-110"
              style={{ background: GOLD }}
            >
              Search
            </button>
          </div>

          {/* stat chips — scientific/data vibe */}
          <div className="flex flex-wrap justify-center gap-3 mt-10 text-xs">
            {['206 Countries', '12 Years of Data', '57,000+ Results', 'Peer-Reviewed'].map((s) => (
              <span key={s} className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/85">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* angled bottom edge for a modern feel */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
      </section>

      {/* ── RANKINGS TABLE: tighter + zebra striping ────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 -mt-6 relative z-10 pb-16">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 text-white"
               style={{ background: `linear-gradient(135deg, ${'#0b1c3d'}, ${'#15294d'})` }}>
            <div className="flex items-center gap-3">
              <span className="font-bold tracking-wide">2026 Provisional Ranking</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: ELECTRIC + '33', color: '#bcd2ff' }}>Live</span>
            </div>
            <span className="text-white/60 text-xs underline">View all →</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                <th className="text-left font-semibold px-5 py-3 w-16">Rank</th>
                <th className="text-left font-semibold px-2 py-3">Country</th>
                <th className="text-right font-semibold px-5 py-3">Points</th>
                <th className="text-center font-semibold px-5 py-3 w-20">Change</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map((r) => (
                <tr
                  key={r.iso}
                  className="odd:bg-white even:bg-slate-50 hover:bg-[#1F6BFF0d] transition-colors border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold tabular-nums ${
                        r.rank === 1 ? 'text-white' : r.rank <= 3 ? 'text-wsr-navy' : 'text-gray-500'
                      }`}
                      style={
                        r.rank === 1
                          ? { background: '#e8a020' }
                          : r.rank <= 3
                          ? { background: '#e8a02022' }
                          : { background: '#f1f5f9' }
                      }
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://flagcdn.com/${r.iso}.svg`} alt="" className="h-4 w-6 rounded-sm object-cover shadow-sm" />
                      <span className="font-medium text-wsr-navy">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-700 tabular-nums">
                    {r.points.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-center"><Change change={r.change} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Narrower table + zebra striping so the eye tracks each row from country → points.
        </p>
      </section>

      {/* ── RANKINGS CARDS: modern hover glow ───────────────────────────── */}
      <section className="bg-wsr-light py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl font-extrabold text-wsr-navy">Our Rankings</h2>
          <div className="w-12 h-1 mx-auto mt-3 mb-10 rounded-full" style={{ background: ELECTRIC }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'WRCES', logo: '/rankings/wrces_final_logo_new.svg', desc: 'World Ranking of Countries in Elite Sport.' },
              { label: 'WFCR', logo: '/rankings/wfcr_logo_new.svg', desc: "World's Fittest Countries Ranking." },
              { label: 'WSPI', logo: '/rankings/wspi_logo_new.svg', desc: 'World Sports Power Index.' },
              { label: 'WRCES Merit', logo: '/rankings/wrces_merit_logo_new.svg', desc: 'Rewards punching above your weight.' },
            ].map((c) => (
              <div
                key={c.label}
                className="group relative bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300" style={{ background: `linear-gradient(90deg, ${ELECTRIC}, #00C2FF)` }} />
                <img src={c.logo} alt={c.label} className="h-12 object-contain mb-4" />
                <h3 className="font-bold text-wsr-navy">{c.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUTURISTIC DATA BAND ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-wsr-navy text-white py-20 px-4">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: 'url(/design/pitch-bg.webp)' }}
        />
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg,#fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-3">Built on a Scientific Method</h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-10 text-sm">
            Every sport weighted by popularity and universality — peer-reviewed and published.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[['206', 'Countries'], ['12', 'Years'], ['52', 'Publications'], ['57k+', 'Sport Results']].map(([n, l]) => (
              <div key={l}>
                <div className="text-4xl font-extrabold" style={{ color: '#7fb0ff' }}>{n}</div>
                <div className="text-white/60 text-xs uppercase tracking-wider mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BACKGROUND OPTIONS (pick one to replace the grid) ───────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold text-wsr-navy">Hero background — pick a vibe</h2>
        <p className="text-center text-gray-500 text-sm mt-2 mb-8">
          The hero above uses <strong>Option A</strong>. Here are alternatives to the old grid — tell me which you prefer.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              name: 'A · Floodlight glow',
              desc: 'Soft stadium-light glow + blue corner glow. Atmospheric, not techy. (currently in the hero)',
              overlay: 'radial-gradient(120% 80% at 50% -15%, rgba(255,255,255,0.20), transparent 55%), radial-gradient(70% 60% at 85% 115%, rgba(31,107,255,0.22), transparent 60%)',
            },
            {
              name: 'B · Soft dots',
              desc: 'Faint dotted texture — subtle grain, much softer than a grid.',
              overlayImage: 'radial-gradient(rgba(255,255,255,0.20) 1.3px, transparent 1.3px)',
              size: '22px 22px',
            },
            {
              name: 'C · Motion streaks',
              desc: 'Diagonal speed lines — a sporty sense of movement.',
              overlayImage: 'repeating-linear-gradient(115deg, transparent 0 40px, rgba(255,255,255,0.06) 40px 43px)',
            },
            {
              name: 'D · Clean (photo only)',
              desc: 'Just the stadium photo + navy wash + the light particles. Minimal.',
            },
          ].map((opt) => (
            <div key={opt.name} className="relative h-56 rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/design/hero-stadium.webp)' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-wsr-navy/95 via-wsr-navy/80 to-[#0b1c3d]/55" />
              <div className="absolute inset-0 opacity-25 mix-blend-screen bg-cover bg-center" style={{ backgroundImage: 'url(/design/particles.webp)' }} />
              {(opt.overlay || opt.overlayImage) && (
                <div
                  className="absolute inset-0"
                  style={
                    opt.overlay
                      ? { background: opt.overlay }
                      : { backgroundImage: opt.overlayImage, backgroundSize: opt.size }
                  }
                />
              )}
              <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-black/30 text-white border border-white/20">
                  {opt.name}
                </span>
                <p className="text-white/80 text-xs mt-3 max-w-xs">{opt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-amber-100 text-amber-900 text-center text-xs py-3 px-4">
        End of preview · tell me which background letter (A/B/C/D) you like and any other tweaks, and I&apos;ll apply it to the real site.
      </div>
    </div>
  )
}
