'use client'

import { useState } from 'react'
import { Button, CountryInput, ErrorNote, inputCls, Modal } from './ui'
import type { Category, Country } from './types'

/**
 * Add / edit form for one row — a sport entry (BY COUNTRY) or a FINAL RANK row.
 * The server re-validates everything; this just makes the common case easy.
 */
export type RecordKind = 'entry' | 'final'

export interface RecordValues {
  year: string
  sport: string
  rank: string
  country: string
  points: string
  progress: string
}

export function emptyRecord(partial: Partial<RecordValues> = {}): RecordValues {
  return { year: '', sport: '', rank: '', country: '', points: '', progress: '-', ...partial }
}

export default function RecordModal({ kind, title, initial, categories, countries, onSave, onClose }: {
  kind: RecordKind
  title: string
  initial: RecordValues
  categories: Category[]
  countries: Country[]
  onSave: (values: RecordValues) => Promise<void>
  onClose: () => void
}) {
  const [v, setV] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof RecordValues) => (val: string) => setV((s) => ({ ...s, [k]: val }))

  const unknownCountry = v.country && !countries.some((c) => c.name === v.country)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave(v)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const field = (label: string, el: React.ReactNode, hint?: React.ReactNode) => (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <div className="mt-1">{el}</div>
      {hint && <span className="text-xs mt-1 block">{hint}</span>}
    </label>
  )

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {field('Year', <input type="number" inputMode="numeric" required value={v.year} onChange={(e) => set('year')(e.target.value)} className={`${inputCls} w-full`} />)}
          {field('Rank', <input type="number" inputMode="numeric" min={1} required value={v.rank} onChange={(e) => set('rank')(e.target.value)} className={`${inputCls} w-full`} />)}
        </div>
        {kind === 'entry' && field('Sport',
          <select required value={v.sport} onChange={(e) => set('sport')(e.target.value)} className={`${inputCls} w-full`}>
            <option value="">Choose a sport…</option>
            {categories.map((c) => <option key={c.sport} value={c.sport}>{c.sport} ({c.type})</option>)}
          </select>)}
        {field('Country',
          <CountryInput id="record-country" value={v.country} onChange={set('country')} countries={countries} className="w-full" />,
          unknownCountry ? <span className="text-red-600">Not in COUNTRIESLIST — choose a name from the list.</span> : null)}
        <div className="grid grid-cols-2 gap-3">
          {field('Points', <input type="number" inputMode="decimal" step="any" min={0} required value={v.points} onChange={(e) => set('points')(e.target.value)} className={`${inputCls} w-full`} />)}
          {kind === 'final' && field('Progress', <input value={v.progress} onChange={(e) => set('progress')(e.target.value.toUpperCase())} placeholder='-, NEW or ±n' className={`${inputCls} w-full`} />)}
        </div>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={busy || Boolean(unknownCountry)}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  )
}
