'use client'

import { useState } from 'react'
import { API } from './api'
import { ErrorNote, inputCls } from './ui'

export default function LoginForm({ adminPath }: { adminPath: string }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Path': adminPath },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) { window.location.reload(); return }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Sign-in failed.')
    } catch {
      setError('Could not reach the server.')
    }
    setPassword('')
    setBusy(false)
  }

  return (
    <div className="min-h-[70vh] bg-wsr-light flex items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-wsr-accent">WSR staff</p>
          <h1 className="text-2xl font-extrabold text-wsr-navy mt-1">Data desk sign-in</h1>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Username</span>
          <input
            className={`${inputCls} w-full mt-1`} value={username} onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            type="password" className={`${inputCls} w-full mt-1`} value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required
          />
        </label>
        <ErrorNote error={error} />
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
