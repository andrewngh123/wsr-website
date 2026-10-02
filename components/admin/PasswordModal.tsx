'use client'

import { useState } from 'react'
import { api } from './api'
import { Button, ErrorNote, inputCls, Modal } from './ui'

const MIN_LENGTH = 12

export default function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (next.length < MIN_LENGTH) return setError(`The new password must be at least ${MIN_LENGTH} characters.`)
    if (next !== repeat) return setError("The new passwords don't match.")
    setBusy(true)
    try {
      await api('/password', { method: 'POST', json: { current, next } })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    }
    setBusy(false)
  }

  if (done) {
    return (
      <Modal title="Password changed" onClose={onClose}>
        <p className="text-sm text-gray-700">Your password has been changed. Any other devices where you were signed in have been signed out.</p>
        <div className="flex justify-end mt-4"><Button variant="primary" onClick={onClose}>Done</Button></div>
      </Modal>
    )
  }

  const field = (label: string, value: string, set: (v: string) => void, autoComplete: string, hint?: string) => (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <input type="password" required value={value} onChange={(e) => set(e.target.value)} autoComplete={autoComplete} className={`${inputCls} w-full mt-1`} />
      {hint && <span className="text-xs text-gray-400 mt-1 block">{hint}</span>}
    </label>
  )

  return (
    <Modal title="Change your password" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {field('Current password', current, setCurrent, 'current-password')}
        {field('New password', next, setNext, 'new-password', `At least ${MIN_LENGTH} characters.`)}
        {field('Repeat new password', repeat, setRepeat, 'new-password')}
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</Button>
        </div>
      </form>
    </Modal>
  )
}
