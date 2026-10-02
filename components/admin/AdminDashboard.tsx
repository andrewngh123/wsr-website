'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { ErrorNote, Loading, fmtDate } from './ui'
import type { EntryFilters, Meta, Nav, Tab } from './types'
import StandingsTab from './tabs/StandingsTab'
import FinalRankTab from './tabs/FinalRankTab'
import CountryTab from './tabs/CountryTab'
import SportTab from './tabs/SportTab'
import EntriesTab from './tabs/EntriesTab'
import ActivityTab from './tabs/ActivityTab'
import UploadTab from './tabs/UploadTab'
import PasswordModal from './PasswordModal'

const TABS: { key: Tab; label: string }[] = [
  { key: 'standings', label: 'Current standings' },
  { key: 'final',     label: 'Final rankings' },
  { key: 'country',   label: 'Countries' },
  { key: 'sport',     label: 'Sports' },
  { key: 'entries',   label: 'Data & editing' },
  { key: 'upload',    label: 'Upload Excel' },
  { key: 'activity',  label: 'Activity' },
]

export default function AdminDashboard({ user }: { user: { display_name: string } }) {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('standings')
  const [country, setCountry] = useState('')
  const [sport, setSport] = useState<{ sport: string; year: number | null }>({ sport: '', year: null })
  const [entryFilters, setEntryFilters] = useState<Partial<EntryFilters>>({})
  const [changingPassword, setChangingPassword] = useState(false)

  const loadMeta = useCallback(() => {
    api<Meta>('/meta').then(setMeta).catch((e) => setError(e.message))
  }, [])
  useEffect(loadMeta, [loadMeta])

  // Remember the open tab across reloads (per browser; harmless if storage is blocked).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('wsr-admin-tab') as Tab | null
      if (saved && TABS.some((t) => t.key === saved)) setTab(saved)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => { try { sessionStorage.setItem('wsr-admin-tab', tab) } catch { /* ignore */ } }, [tab])

  const nav: Nav = useMemo(() => ({
    openCountry: (c) => { setCountry(c); setTab('country'); window.scrollTo({ top: 0 }) },
    openSport: (s, y = null) => { setSport({ sport: s, year: y }); setTab('sport'); window.scrollTo({ top: 0 }) },
    openEntries: (f) => { setEntryFilters(f); setTab('entries'); window.scrollTo({ top: 0 }) },
  }), [])

  async function logout() {
    await fetch('/api/wsr-admin/logout', { method: 'POST' }).catch(() => null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-wsr-light">
      <div className="bg-wsr-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-wsr-accent">WSR staff · internal</p>
            <h1 className="text-2xl font-extrabold">Data desk</h1>
            {meta?.lastImport && (
              <p className="text-xs text-white/60 mt-1">
                Data from {meta.lastImport.source}, loaded {fmtDate(meta.lastImport.at)}{meta.lastImport.by ? ` by ${meta.lastImport.by}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
            <span className="text-white/80">Signed in as <strong className="text-white">{user.display_name}</strong></span>
            <button onClick={() => setChangingPassword(true)} className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">Change password</button>
            <button onClick={logout} className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">Sign out</button>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto" aria-label="Dashboard sections">
          <ul className="flex gap-1 min-w-max">
            {TABS.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setTab(t.key)}
                  aria-current={tab === t.key ? 'page' : undefined}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
                    tab === t.key ? 'bg-wsr-light text-wsr-navy' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ErrorNote error={error} />
        {!meta ? (!error && <Loading />) : tab === 'upload' || meta.years.length === 0 ? (
          <UploadTab meta={meta} onDone={loadMeta} />
        ) : (
          <>
            {tab === 'standings' && <StandingsTab meta={meta} nav={nav} onMetaChange={loadMeta} />}
            {tab === 'final' && <FinalRankTab meta={meta} nav={nav} />}
            {tab === 'country' && <CountryTab meta={meta} nav={nav} country={country} setCountry={setCountry} />}
            {tab === 'sport' && <SportTab meta={meta} nav={nav} sport={sport.sport} year={sport.year} onChange={setSport} />}
            {tab === 'entries' && <EntriesTab meta={meta} nav={nav} initialFilters={entryFilters} />}
            {tab === 'activity' && <ActivityTab />}
          </>
        )}
      </div>
      {changingPassword && <PasswordModal onClose={() => setChangingPassword(false)} />}
    </div>
  )
}
