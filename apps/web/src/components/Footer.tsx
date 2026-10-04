import { Link } from 'react-router-dom'
import { GeminiMark } from './GeminiMark'

type FooterLink =
  | { label: string; href: string }
  | { label: string; to: string }

const footerLinks: FooterLink[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Download', href: '/#download' },
  { label: 'Privacy Policy', to: '/privacy' },
]

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-gemini-border)] bg-[var(--color-gemini-bg-soft)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-md items-start gap-3">
            <GeminiMark size={28} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-[var(--color-gemini-text)]">NoteStack</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-gemini-text-muted)]">
                Local AI meeting notes. Your voice stays on your Mac—like Gemini, but entirely on-device.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16 lg:items-start">
            <nav aria-label="Footer">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-gemini-text-muted)]">
                Explore
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {footerLinks.map((item) => (
                  <li key={item.label}>
                    {'to' in item ? (
                      <Link
                        to={item.to}
                        className="text-[var(--color-gemini-text-secondary)] transition hover:text-[var(--color-gemini-blue)]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-[var(--color-gemini-text-secondary)] transition hover:text-[var(--color-gemini-blue)]"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="text-sm text-[var(--color-gemini-text-muted)] sm:text-right">
              <p>© {new Date().getFullYear()} NoteStack. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
