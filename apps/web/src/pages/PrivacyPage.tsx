import { Link } from 'react-router-dom'
import { GeminiMark } from '../components/GeminiMark'

export function PrivacyPage() {
  return (
    <>
      <div className="border-b border-[var(--color-gemini-border)] bg-[var(--color-gemini-bg-soft)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/" className="gemini-text-link text-sm">
            ← Back to home
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <GeminiMark size={36} className="mt-1 shrink-0" />
            <div>
              <h1 className="text-4xl font-normal tracking-tight text-[var(--color-gemini-text)]">
                Privacy Policy
              </h1>
              <p className="mt-2 text-sm text-[var(--color-gemini-text-muted)]">
                Last updated: October 3, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-6">
          <section className="gemini-prose-section">
            <h2>Our approach</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-gemini-text-secondary)]">
              Record Plus is designed so your meeting audio and transcripts remain on your Mac. This
              policy describes what the app does locally, what this marketing website collects (if
              anything), and how we think about your data.
            </p>
          </section>

          <section className="gemini-prose-section">
            <h2>Meeting data</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-[var(--color-gemini-text-secondary)]">
              <li>
                <strong className="text-[var(--color-gemini-text)]">Audio recordings</strong> are stored
                on your device. Record Plus does not upload audio to Record Plus servers.
              </li>
              <li>
                <strong className="text-[var(--color-gemini-text)]">Transcripts and notes</strong> are
                saved locally. You control export, backup, and deletion.
              </li>
              <li>
                <strong className="text-[var(--color-gemini-text)]">AI processing</strong> uses Ollama on
                your machine. Model inference runs locally; content is not sent to Record Plus for cloud
                LLM processing.
              </li>
            </ul>
          </section>

          <section className="gemini-prose-section">
            <h2>Ollama</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-gemini-text-secondary)]">
              Ollama is a separate project you install and manage. When you pull models or update Ollama,
              those actions follow Ollama&apos;s own terms and network behavior. Record Plus only
              communicates with your local Ollama instance (typically{' '}
              <code className="rounded-lg bg-[var(--color-gemini-chip)] px-1.5 py-0.5 text-sm text-[var(--color-gemini-blue)]">
                localhost
              </code>
              ).
            </p>
          </section>

          <section className="gemini-prose-section">
            <h2>This website</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-gemini-text-secondary)]">
              This static site does not require an account. We do not use third-party analytics on this
              page by default. If we add optional analytics or a waitlist in the future, we will update
              this policy and keep collection minimal.
            </p>
          </section>

          <section className="gemini-prose-section">
            <h2>Downloads</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-gemini-text-secondary)]">
              When the Mac .dmg is available, downloading it may be served from our CDN or GitHub
              Releases. Standard server logs (IP, user agent) may be retained briefly for security and
              reliability—not for profiling.
            </p>
          </section>

          <section className="gemini-prose-section">
            <h2>Contact</h2>
            <p className="mt-3 leading-relaxed text-[var(--color-gemini-text-secondary)]">
              Questions about privacy? Email{' '}
              <a href="mailto:privacy@recordplus.app" className="gemini-text-link">
                privacy@recordplus.app
              </a>{' '}
              (placeholder).
            </p>
          </section>
        </div>
      </article>
    </>
  )
}
