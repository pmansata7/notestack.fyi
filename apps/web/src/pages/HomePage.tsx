import { DownloadButton } from '../components/DownloadButton'
import { NoteStackMark } from '../components/NoteStackMark'
import { WaitlistForm } from '../components/WaitlistForm'

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
    body: 'NoteStack walks you through installing Ollama and pulling a speech or text model that fits your hardware.',
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
    noteStack: 'Stays on your Mac',
    typicalCloud: 'Often uploaded for processing',
  },
  {
    aspect: 'Transcript storage',
    noteStack: 'Local files you own',
    typicalCloud: 'Vendor-hosted databases',
  },
  {
    aspect: 'AI processing',
    noteStack: 'Ollama on your hardware',
    typicalCloud: 'Remote API inference',
  },
  {
    aspect: 'Works offline',
    noteStack: 'Yes, after model setup',
    typicalCloud: 'Usually requires connectivity',
  },
  {
    aspect: 'Data retention',
    noteStack: 'You delete when you want',
    typicalCloud: 'Subject to provider policies',
  },
]

const quickFeatures = [
  'Menu bar recording with one click',
  'Search across local transcripts',
  'Export notes in standard formats',
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
    <section className="relative overflow-hidden border-b border-[var(--color-gemini-border)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% -10%, rgba(66, 133, 244, 0.14), transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <NoteStackMark size={56} variant="light" />
          </div>
          <p className="gemini-chip mb-6 inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium tracking-wide">
            <span className="text-[var(--color-gemini-blue)]">Privacy-first</span>
            <span className="text-[var(--color-gemini-text-muted)]" aria-hidden>·</span>
            <span>Local AI</span>
            <span className="text-[var(--color-gemini-text-muted)]" aria-hidden>·</span>
            <span>macOS</span>
          </p>
          <h1 className="text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gemini-gradient-text font-medium">Meeting notes</span>
            <br />
            that never leave your Mac
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-gemini-text-secondary)] sm:text-xl">
            NoteStack captures conversations, transcribes on device, and summarizes with{' '}
            <strong className="font-medium text-[var(--color-gemini-text)]">Ollama</strong>—a
            Gemini-like experience powered entirely on your hardware.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <DownloadButton size="large" />
            <a href="#how-it-works" className="gemini-btn-secondary w-full sm:w-auto">
              See how it works
            </a>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-[var(--color-gemini-text-muted)]">
            Requires macOS and Ollama · No account required · No cloud upload of audio
          </p>
        </div>
      </div>
    </section>
  )
}

function PrivacyPillarsSection() {
  return (
    <section className="border-b border-[var(--color-gemini-border)] bg-[var(--color-gemini-bg-soft)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="gemini-section-heading">
            Built on <span className="gemini-gradient-text font-medium">privacy pillars</span>
          </h2>
          <p className="gemini-section-lead">
            Trust isn&apos;t a checkbox—it&apos;s the architecture. Every design choice keeps your
            voice and words local.
          </p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {privacyPillars.map((pillar) => (
            <li key={pillar.title} className="gemini-card gemini-card-interactive p-6">
              <div className="gemini-icon-badge">
                <PillarIcon name={pillar.icon} />
              </div>
              <h3 className="mt-4 font-medium text-[var(--color-gemini-text)]">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-gemini-text-secondary)]">
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
  const className = 'h-5 w-5'
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
    <section id="how-it-works" className="scroll-mt-20 border-b border-[var(--color-gemini-border)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <h2 className="gemini-section-heading">
              How it works with <span className="gemini-gradient-text font-medium">Ollama</span>
            </h2>
            <p className="gemini-section-lead">
              Ollama runs open models on your Mac. NoteStack connects to your local Ollama instance—not
              a hosted API—so summaries stay on the same machine as your recordings.
            </p>
            <div className="gemini-card mt-8 border-[var(--color-gemini-blue-soft)] bg-[color-mix(in_srgb,var(--color-gemini-blue-soft)_35%,white)] p-6">
              <h3 className="font-medium text-[var(--color-gemini-blue)]">First-time onboarding</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-gemini-text-secondary)]">
                When you open NoteStack, we detect whether Ollama is installed. If not, you get
                step-by-step guidance: install Ollama, pull a recommended model, and verify the
                connection—usually under five minutes on Apple Silicon or Intel Macs.
              </p>
            </div>
          </div>
          <ol className="space-y-4">
            {howItWorks.map((item) => (
              <li key={item.step} className="gemini-card flex gap-4 p-5">
                <span className="gemini-step-badge">{item.step}</span>
                <div>
                  <h3 className="font-medium text-[var(--color-gemini-text)]">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-gemini-text-secondary)]">
                    {item.body}
                  </p>
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
    <section id="features" className="scroll-mt-20 bg-[var(--color-gemini-bg-soft)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="gemini-section-heading">Local-first vs. typical cloud note tools</h2>
          <p className="gemini-section-lead">
            Many meeting assistants process everything in the cloud. NoteStack trades that for
            control—without sacrificing AI-powered summaries on your own hardware.
          </p>
        </div>

        <ComparisonMobileList />

        <div className="gemini-card mt-10 hidden overflow-hidden md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-gemini-border)] bg-white">
                <th scope="col" className="w-[34%] px-6 py-4 font-medium text-[var(--color-gemini-text-muted)]">
                  Topic
                </th>
                <th
                  scope="col"
                  className="w-[33%] px-6 py-4 font-medium text-[var(--color-gemini-blue)] bg-[color-mix(in_srgb,var(--color-gemini-blue-soft)_40%,white)]"
                >
                  NoteStack
                </th>
                <th scope="col" className="w-[33%] px-6 py-4 font-medium text-[var(--color-gemini-text-muted)]">
                  Typical cloud assistant
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b border-[var(--color-gemini-border)] last:border-0">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-[var(--color-gemini-text-secondary)]"
                  >
                    {row.aspect}
                  </th>
                  <td className="px-6 py-4 text-[var(--color-gemini-text)] bg-[color-mix(in_srgb,var(--color-gemini-blue-soft)_22%,white)]">
                    {row.noteStack}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-gemini-text-muted)]">{row.typicalCloud}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {quickFeatures.map((feature) => (
            <li
              key={feature}
              className="gemini-card flex items-start gap-3 px-5 py-4 text-sm text-[var(--color-gemini-text-secondary)]"
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

function ComparisonMobileList() {
  return (
    <ul className="mt-10 space-y-4 md:hidden">
      {comparisonRows.map((row) => (
        <li key={row.aspect} className="gemini-card overflow-hidden">
          <div className="border-b border-[var(--color-gemini-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-gemini-text)]">
            {row.aspect}
          </div>
          <div className="grid divide-y divide-[var(--color-gemini-border)]">
            <div className="bg-[color-mix(in_srgb,var(--color-gemini-blue-soft)_30%,white)] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-gemini-blue)]">
                NoteStack
              </p>
              <p className="mt-1 text-sm text-[var(--color-gemini-text)]">{row.noteStack}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-gemini-text-muted)]">
                Typical cloud assistant
              </p>
              <p className="mt-1 text-sm text-[var(--color-gemini-text-muted)]">{row.typicalCloud}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-gemini-blue)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DownloadSection() {
  return (
    <section id="download" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className="gemini-card overflow-hidden px-6 py-12 text-center sm:px-12"
          style={{
            background:
              'linear-gradient(145deg, #ffffff 0%, var(--color-gemini-bg-soft) 55%, color-mix(in srgb, var(--color-gemini-blue-soft) 35%, white) 100%)',
          }}
        >
          <NoteStackMark size={40} className="mx-auto" variant="light" />
          <h2 className="mt-5 gemini-section-heading">
            Ready for <span className="gemini-gradient-text font-medium">private</span> meeting notes?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[var(--color-gemini-text-secondary)]">
            Download NoteStack for Mac, set up Ollama once, and keep every transcript on your machine.
            The .dmg installer will be available here when we ship.
          </p>
          <div className="mt-8">
            <DownloadButton size="large" />
          </div>
          <WaitlistForm />
          <p className="mt-6 text-xs text-[var(--color-gemini-text-muted)]">
            Requires macOS 13+ and Ollama · Universal build for Apple Silicon and Intel
          </p>
        </div>
      </div>
    </section>
  )
}
