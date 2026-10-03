import { Link } from 'react-router-dom'
import { GeminiMark } from './GeminiMark'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-gemini-border)] bg-[var(--color-gemini-bg-soft)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <GeminiMark size={24} />
          <div>
            <p className="font-medium text-[var(--color-gemini-text)]">Record Plus</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-gemini-text-muted)]">
              Local AI meeting notes. Your voice stays on your Mac—like Gemini, but entirely on-device.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[var(--color-gemini-text-secondary)] sm:items-end">
          <Link to="/privacy" className="hover:text-[var(--color-gemini-blue)]">
            Privacy Policy
          </Link>
          <p className="text-[var(--color-gemini-text-muted)]">
            © {new Date().getFullYear()} Record Plus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
