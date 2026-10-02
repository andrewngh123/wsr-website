'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import CountryFlag from '@/components/CountryFlag'
import type { Country, SportType } from './types'

// ── Formatting ───────────────────────────────────────────────────────────────
export const fmtPts = (n: number | null | undefined, digits = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits })

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// ── Layout primitives ────────────────────────────────────────────────────────
export function Card({ title, actions, children, className = '' }: {
  title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
          {title && <h2 className="text-base font-bold text-wsr-navy">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-2xl font-extrabold text-wsr-navy mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export const inputCls =
  'border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-wsr-blue/30 focus:border-wsr-blue'

export function Button({ children, variant = 'secondary', className = '', ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const styles = {
    primary:   'bg-wsr-navy text-white hover:bg-wsr-blue',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-wsr-blue hover:bg-wsr-light',
  }[variant]
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function LinkButton({ href, children, newTab }: { href: string; children: ReactNode; newTab?: boolean }) {
  return (
    <a
      href={href}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
    >
      {children}
    </a>
  )
}

export function Select({ value, onChange, children, className = '', label }: {
  value: string | number; onChange: (v: string) => void; children: ReactNode; className?: string; label?: string
}) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${className}`}>
      {children}
    </select>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-10 text-center text-sm text-gray-400 italic">{label}</p>
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null
  return <p role="alert" className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-gray-400">{children}</p>
}

const TYPE_STYLE: Record<SportType, string> = {
  IND:  'bg-sky-50 text-sky-700 border-sky-100',
  TEAM: 'bg-amber-50 text-amber-700 border-amber-100',
  PART: 'bg-violet-50 text-violet-700 border-violet-100',
}
const TYPE_LABEL: Record<SportType, string> = { IND: 'Individual', TEAM: 'Team', PART: 'Participation' }

export function TypeBadge({ type }: { type?: SportType | string | null }) {
  if (!type) return null
  const t = type as SportType
  return (
    <span title={TYPE_LABEL[t]} className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_STYLE[t] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
      {type}
    </span>
  )
}

/** Signed movement, e.g. "+3" green / "-2" red / "-" grey. */
export function Movement({ value }: { value: number | string | null | undefined }) {
  if (value == null || value === '' || value === '-' || value === 0) return <span className="text-gray-400 text-xs">–</span>
  if (value === 'NEW') return <span className="text-[10px] font-bold text-wsr-accent">NEW</span>
  const n = Number(value)
  if (Number.isNaN(n)) return <span className="text-xs text-gray-500">{value}</span>
  return n > 0
    ? <span className="text-green-600 text-xs font-semibold">▲ {n}</span>
    : <span className="text-red-500 text-xs font-semibold">▼ {Math.abs(n)}</span>
}

// ── Countries ────────────────────────────────────────────────────────────────
export function CountryName({ name, countries, onClick }: {
  name: string; countries: Map<string, Country>; onClick?: () => void
}) {
  const iso = countries.get(name)?.iso_2
  const inner = (
    <span className="inline-flex items-center gap-2">
      {iso ? <CountryFlag iso2={iso} name={name} /> : <span className="inline-block h-4 w-6 rounded-sm bg-gray-100" />}
      <span>{name}</span>
    </span>
  )
  return onClick
    ? <button type="button" onClick={onClick} className="text-left font-medium text-wsr-blue hover:underline">{inner}</button>
    : inner
}

/** Free-text input that autocompletes from the canonical COUNTRIESLIST names. */
export function CountryInput({ value, onChange, countries, id, placeholder = 'Country…', className = '', autoFocus }: {
  value: string; onChange: (v: string) => void; countries: Country[]; id: string
  placeholder?: string; className?: string; autoFocus?: boolean
}) {
  return (
    <>
      <input
        id={id}
        list={`${id}-list`}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputCls} ${className}`}
      />
      <datalist id={`${id}-list`}>
        {countries.map((c) => <option key={c.code} value={c.name}>{c.code}</option>)}
      </datalist>
    </>
  )
}

// ── Tables ───────────────────────────────────────────────────────────────────
export function Th({ children, align = 'left', sortKey, sort, onSort, className = '' }: {
  children: ReactNode; align?: 'left' | 'right' | 'center'; className?: string
  sortKey?: string; sort?: { key: string; dir: 'asc' | 'desc' }; onSort?: (key: string) => void
}) {
  const active = sortKey && sort?.key === sortKey
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th
      aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${alignCls} ${className}`}
    >
      {sortKey && onSort ? (
        <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 uppercase hover:text-wsr-navy ${active ? 'text-wsr-navy' : ''}`}>
          {children}<span aria-hidden className="text-[9px]">{active ? (sort!.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
        </button>
      ) : children}
    </th>
  )
}

export const tableCls = 'w-full text-sm'
export const theadCls = 'bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]'
export const rowCls = 'border-b border-gray-50 last:border-0 hover:bg-slate-50'
export const tdCls = 'px-3 py-2'
export const numCls = 'px-3 py-2 text-right tabular-nums'

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-wsr-navy/40 p-4 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-md'} my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-wsr-navy">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/** Client-side CSV download for tables already on screen. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
