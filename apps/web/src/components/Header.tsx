import { Link, NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
  }`

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--color-surface-950)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-800)] ring-1 ring-white/10">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">Record Plus</span>
        </Link>
        <nav className="flex items-center gap-6 sm:gap-8">
          <a href="/#features" className="hidden text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] sm:inline">
            Features
          </a>
          <a href="/#how-it-works" className="hidden text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] sm:inline">
            How it works
          </a>
          <NavLink to="/privacy" className={navLinkClass}>
            Privacy
          </NavLink>
          <a
            href="#download"
            className="rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-[var(--color-surface-950)] transition hover:bg-[var(--color-accent-muted)]"
          >
            Download
          </a>
        </nav>
      </div>
    </header>
  )
}
