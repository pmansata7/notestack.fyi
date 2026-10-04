import { Link, NavLink } from 'react-router-dom'
import { GeminiMark } from './GeminiMark'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-[var(--color-gemini-blue-soft)] text-[var(--color-gemini-blue)]'
      : 'text-[var(--color-gemini-text-secondary)] hover:bg-[var(--color-gemini-chip)] hover:text-[var(--color-gemini-text)]'
  }`

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-gemini-border)] bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(60,64,67,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-gemini-blue)]"
        >
          <GeminiMark size={32} />
          <span className="truncate text-lg font-normal tracking-tight text-[var(--color-gemini-text)]">
            Note<span className="gemini-gradient-text font-medium">Stack</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <a href="/#features" className="gemini-nav-link hidden sm:inline">
            Features
          </a>
          <a href="/#how-it-works" className="gemini-nav-link hidden sm:inline">
            How it works
          </a>
          <NavLink to="/privacy" className={navLinkClass}>
            Privacy
          </NavLink>
          <a
            href="/#download"
            className="ml-1 rounded-full bg-[var(--color-gemini-blue)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-gemini-blue-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gemini-blue)]"
          >
            Download
          </a>
        </nav>
      </div>
    </header>
  )
}
