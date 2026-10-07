import { Link } from 'react-router-dom'
import { NoteStackMark } from '../components/NoteStackMark'

export function PrivacyPage() {
  return (
    <>
      <div className="border-b border-[var(--color-ns-border)] bg-[var(--color-ns-bg-elevated)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/" className="ns-text-link text-sm">
            ← Back to home
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <NoteStackMark size={36} className="mt-1 shrink-0" variant="light" />
            <div>
              <h1 className="ns-display text-4xl">Privacy Policy</h1>
              <p className="mt-2 text-sm text-[var(--color-ns-text-muted)]">
                Last updated: October 3, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-6">
          <section className="ns-prose-section">
            <h2>Our approach</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-ns-text-secondary)]">
              NoteStack is designed so your meeting audio and transcripts remain on your Mac. This
              policy describes what the app does locally, what this marketing website collects (if
              anything), and how we think about your data.
            </p>
          </section>

          <section className="ns-prose-section">
            <h2>Meeting data</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-[var(--color-ns-text-secondary)]">
              <li>
                <strong className="text-[var(--color-ns-text)]">Audio recordings</strong> are stored
                on your device. NoteStack does not upload audio to NoteStack servers.
              </li>
              <li>
                <strong className="text-[var(--color-ns-text)]">Transcripts and notes</strong> are
                saved locally. You control export, backup, and deletion.
              </li>
              <li>
                <strong className="text-[var(--color-ns-text)]">AI processing</strong> uses Ollama on
                your machine. Model inference runs locally; content is not sent to NoteStack for cloud
                LLM processing.
              </li>
            </ul>
          </section>

          <section className="ns-prose-section">
            <h2>Ollama</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-ns-text-secondary)]">
              Ollama is a separate project you install and manage. When you pull models or update Ollama,
              those actions follow Ollama&apos;s own terms and network behavior. NoteStack only
              communicates with your local Ollama instance (typically{' '}
              <code className="rounded-[var(--radius-ns)] border border-[var(--color-ns-border)] bg-[var(--color-ns-chip)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-ns-accent)]">
                localhost
              </code>
              ).
            </p>
          </section>

          <section className="ns-prose-section">
            <h2>This website</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-ns-text-secondary)]">
              This static site does not require an account. We do not use third-party analytics on this
              page by default. If we add optional analytics or a waitlist in the future, we will update
              this policy and keep collection minimal.
            </p>
          </section>

          <section className="ns-prose-section">
            <h2>Downloads</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-ns-text-secondary)]">
              When the Mac .dmg is available, downloading it may be served from our CDN or GitHub
              Releases. Standard server logs (IP, user agent) may be retained briefly for security and
              reliability—not for profiling.
            </p>
          </section>

          <section className="ns-prose-section">
            <h2>Contact</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-ns-text-secondary)]">
              Questions about privacy? Email{' '}
              <a href="mailto:privacy@notestack.fyi" className="ns-text-link">
                privacy@notestack.fyi
              </a>{' '}
              (placeholder).
            </p>
          </section>
        </div>
      </article>
    </>
  )
}
