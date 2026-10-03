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
    <header className="sticky top-0 z-50 border-b border-[var(--color-gemini-border)] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <GeminiMark size={32} />
          <span className="text-lg font-normal tracking-tight text-[var(--color-gemini-text)]">
            Record <span className="gemini-gradient-text font-medium">Plus</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="/#features"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-[var(--color-gemini-text-secondary)] hover:bg-[var(--color-gemini-chip)] sm:inline"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-[var(--color-gemini-text-secondary)] hover:bg-[var(--color-gemini-chip)] sm:inline"
          >
            How it works
          </a>
          <NavLink to="/privacy" className={navLinkClass}>
            Privacy
          </NavLink>
          <a
            href="#download"
            className="ml-1 rounded-full bg-[var(--color-gemini-blue)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-gemini-blue-hover)]"
          >
            Download
          </a>
        </nav>
      </div>
    </header>
  )
}
