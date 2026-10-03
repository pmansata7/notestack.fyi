import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[var(--color-surface-900)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold">Record Plus</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Meeting notes powered by local AI. Your voice never leaves your Mac.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)] sm:items-end">
          <Link to="/privacy" className="hover:text-[var(--color-accent)]">
            Privacy Policy
          </Link>
          <p className="text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Record Plus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
