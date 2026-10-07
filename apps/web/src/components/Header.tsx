import { Link, NavLink } from 'react-router-dom'
import { NoteStackLogo } from './NoteStackLogo'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-[var(--color-ns-accent-soft)] text-[var(--color-ns-accent)]'
      : 'text-[var(--color-ns-text-secondary)] hover:bg-[var(--color-ns-chip)] hover:text-[var(--color-ns-text)]'
  }`

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-ns-border)] bg-[var(--color-ns-bg-elevated)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-ns-accent)]"
        >
          <NoteStackLogo height={28} className="h-7 w-auto max-w-[min(100%,11rem)]" />
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <a href="/#features" className="ns-nav-link hidden sm:inline">
            Features
          </a>
          <a href="/#how-it-works" className="ns-nav-link hidden sm:inline">
            How it works
          </a>
          <NavLink to="/privacy" className={navLinkClass}>
            Privacy
          </NavLink>
          <a href="/#download" className="ns-btn-primary ml-1 px-4 py-2 text-sm">
            Download
          </a>
        </nav>
      </div>
    </header>
  )
}
