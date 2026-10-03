import { DownloadButton } from '../components/DownloadButton'

const privacyPillars = [
  {
    title: 'Audio stays on your Mac',
    description:
      'Recordings are captured and processed locally. We never upload your meeting audio to our servers or third-party clouds.',
    icon: 'shield',
  },
  {
    title: 'Transcripts on device',
    description:
      'Notes and transcripts live in your local storage. You choose what to export, share, or delete.',
    icon: 'disk',
  },
  {
    title: 'Local models via Ollama',
    description:
      'Summaries and insights run through Ollama on your machine—no API keys sending content to remote LLM providers.',
    icon: 'cpu',
  },
  {
    title: 'You control the stack',
    description:
      'Pick your models, manage updates, and disconnect from the network when you need air-gapped peace of mind.',
    icon: 'lock',
  },
]

const howItWorks = [
  {
    step: '1',
    title: 'Install Ollama',
    body: 'Record Plus walks you through installing Ollama and pulling a speech or text model that fits your hardware.',
  },
  {
    step: '2',
    title: 'Record a meeting',
    body: 'Start capture from the menu bar. Audio is written to disk on your Mac—nothing streams to the cloud.',
  },
  {
    step: '3',
    title: 'Transcribe locally',
    body: 'On-device transcription turns speech into text without sending audio elsewhere.',
  },
  {
    step: '4',
    title: 'Summarize with local AI',
    body: 'Ollama generates action items, summaries, and searchable notes—all offline-capable once models are downloaded.',
  },
]

const comparisonRows = [
  {
    aspect: 'Where audio goes',
    recordPlus: 'Stays on your Mac',
    typicalCloud: 'Often uploaded for processing',
  },
  {
    aspect: 'Transcript storage',
    recordPlus: 'Local files you own',
    typicalCloud: 'Vendor-hosted databases',
  },
  {
    aspect: 'AI processing',
    recordPlus: 'Ollama on your hardware',
    typicalCloud: 'Remote API inference',
  },
  {
    aspect: 'Works offline',
    recordPlus: 'Yes, after model setup',
    typicalCloud: 'Usually requires connectivity',
  },
  {
    aspect: 'Data retention',
    recordPlus: 'You delete when you want',
    typicalCloud: 'Subject to provider policies',
  },
]

export function HomePage() {
  return (
    <>
      <HeroSection />
      <PrivacyPillarsSection />
      <HowItWorksSection />
      <FeaturesComparisonSection />
      <DownloadSection />
    </>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(94,234,212,0.15),transparent)]"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-trust)]/30 bg-[var(--color-trust)]/10 px-3 py-1 text-xs font-medium text-[var(--color-trust)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-trust)]" />
            Privacy-first · Local AI · macOS
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Meeting notes that never leave your Mac
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-secondary)] sm:text-xl">
            Record Plus captures conversations, transcribes on device, and summarizes with{' '}
            <strong className="font-medium text-[var(--color-text-primary)]">Ollama</strong>—so
            sensitive discussions stay under your control, not in someone else&apos;s cloud.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <DownloadButton size="large" />
            <a
              href="#how-it-works"
              className="rounded-xl border border-white/10 px-8 py-4 text-base font-medium text-[var(--color-text-primary)] transition hover:border-white/20 hover:bg-white/5"
            >
              See how it works
            </a>
          </div>
          <p className="mt-8 text-sm text-[var(--color-text-muted)]">
            Requires macOS and Ollama · No account required · No cloud upload of audio
          </p>
        </div>
      </div>
    </section>
  )
}

function PrivacyPillarsSection() {
  return (
    <section className="border-b border-white/5 bg-[var(--color-surface-900)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built on privacy pillars</h2>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Trust isn&apos;t a checkbox—it&apos;s the architecture. Every design choice keeps your
            voice and words local.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {privacyPillars.map((pillar) => (
            <li
              key={pillar.title}
              className="rounded-2xl border border-white/5 bg-[var(--color-surface-800)]/50 p-6 transition hover:border-[var(--color-accent)]/20"
            >
              <PillarIcon name={pillar.icon} />
              <h3 className="mt-4 font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {pillar.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PillarIcon({ name }: { name: string }) {
  const className = 'h-10 w-10 text-[var(--color-accent)]'
  switch (name) {
    case 'shield':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    case 'disk':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      )
    case 'cpu':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      )
  }
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-white/5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works with Ollama</h2>
            <p className="mt-4 text-[var(--color-text-secondary)]">
              Ollama runs open models on your Mac. Record Plus connects to your local Ollama instance—
              not a hosted API—so summaries and chat about your notes stay on the same machine as your
              recordings.
            </p>
            <div className="mt-8 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-surface-800)] p-6">
              <h3 className="font-semibold text-[var(--color-accent)]">First-time onboarding</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                When you open Record Plus, we detect whether Ollama is installed. If not, you get
                step-by-step guidance: install Ollama, pull a recommended model, and verify the
                connection—usually under five minutes on Apple Silicon or Intel Macs.
              </p>
            </div>
          </div>
          <ol className="space-y-4">
            {howItWorks.map((item) => (
              <li
                key={item.step}
                className="flex gap-4 rounded-2xl border border-white/5 bg-[var(--color-surface-900)] p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-sm font-bold text-[var(--color-accent)]">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function FeaturesComparisonSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-[var(--color-surface-900)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Local-first vs. typical cloud note tools</h2>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Many meeting assistants are convenient because they process everything in the cloud. Record
            Plus trades that tradeoff for control—without sacrificing AI-powered summaries on your own
            hardware.
          </p>
        </div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[var(--color-surface-800)]">
                <th scope="col" className="px-4 py-4 font-semibold sm:px-6">
                  {' '}
                </th>
                <th scope="col" className="px-4 py-4 font-semibold text-[var(--color-accent)] sm:px-6">
                  Record Plus
                </th>
                <th scope="col" className="px-4 py-4 font-semibold text-[var(--color-text-muted)] sm:px-6">
                  Typical cloud assistant
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b border-white/5 last:border-0">
                  <th scope="row" className="px-4 py-4 font-medium text-[var(--color-text-secondary)] sm:px-6">
                    {row.aspect}
                  </th>
                  <td className="px-4 py-4 sm:px-6">{row.recordPlus}</td>
                  <td className="px-4 py-4 text-[var(--color-text-muted)] sm:px-6">{row.typicalCloud}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            'Menu bar recording with one click',
            'Search across local transcripts',
            'Export notes in standard formats',
          ].map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 rounded-xl border border-white/5 px-4 py-3 text-sm text-[var(--color-text-secondary)]"
            >
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-trust)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DownloadSection() {
  return (
    <section id="download" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-surface-800)] to-[var(--color-surface-900)] px-6 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">Ready for private meeting notes?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-text-secondary)]">
            Download Record Plus for Mac, set up Ollama once, and keep every transcript on your machine.
            The .dmg installer will be available here when we ship.
          </p>
          <div className="mt-8">
            <DownloadButton size="large" />
          </div>
          <p className="mt-6 text-xs text-[var(--color-text-muted)]">
            Placeholder link · Replace with signed .dmg URL before launch
          </p>
        </div>
      </div>
    </section>
  )
}
