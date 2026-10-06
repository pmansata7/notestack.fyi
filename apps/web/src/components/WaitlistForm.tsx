import { useState, type FormEvent } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  if (!isSupabaseConfigured()) {
    return null
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setStatus('error')
      setMessage('Waitlist is not configured yet.')
      return
    }

    setStatus('loading')
    setMessage('')

    const { error } = await supabase.from('waitlist').insert({
      email: trimmed,
      source: 'website',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    })

    if (error) {
      const duplicate = error.code === '23505'
      setStatus(duplicate ? 'success' : 'error')
      setMessage(
        duplicate
          ? "You're already on the list — we'll email you when the Mac build ships."
          : 'Something went wrong. Try again in a moment.',
      )
      return
    }

    setStatus('success')
    setMessage("You're on the list. We'll notify you when the Mac build is ready.")
    setEmail('')
  }

  return (
    <div className="mx-auto mt-8 max-w-md text-left">
      <p className="text-center text-sm text-[var(--color-gemini-text-secondary)]">
        Get an email when the macOS download goes live.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch"
        noValidate
      >
        <label className="sr-only" htmlFor="waitlist-email">Email</label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          placeholder="you@company.com"
          className="min-w-0 flex-1 rounded-full border border-[var(--color-gemini-border)] bg-white px-5 py-3 text-sm text-[var(--color-gemini-text)] shadow-sm outline-none transition focus-visible:border-[var(--color-gemini-blue)] focus-visible:ring-2 focus-visible:ring-[var(--color-gemini-blue-soft)]"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="gemini-btn-secondary shrink-0 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : status === 'success' ? 'Joined' : 'Notify me'}
        </button>
      </form>
      {message ? (
        <p
          role="status"
          className={`mt-3 text-center text-sm ${
            status === 'error'
              ? 'text-red-600'
              : 'text-[var(--color-gemini-text-secondary)]'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
