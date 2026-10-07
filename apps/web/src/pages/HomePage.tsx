import heroImage from '../assets/hero.png'
import { DownloadButton } from '../components/DownloadButton'
import { NoteStackMark } from '../components/NoteStackMark'

const privacyPillars = [
  {
    title: 'Audio stays on your Mac',
    description:
      'Recordings are captured and processed locally. Nothing is uploaded for transcription.',
    icon: 'shield',
  },
  {
    title: 'Transcripts on device',
    description: 'Notes live in local storage. Export, share, or delete on your terms.',
    icon: 'disk',
  },
  {
    title: 'Local models via Ollama',
    description: 'Summaries run through Ollama on your machine—no remote LLM API keys required.',
    icon: 'cpu',
  },
  {
    title: 'You control the stack',
    description: 'Pick models, manage updates, and work offline once setup is done.',
    icon: 'lock',
  },
]

const howItWorks = [
  {
    step: '1',
    title: 'Install Ollama',
    body: 'NoteStack checks for Ollama and walks you through pulling a model that fits your Mac.',
  },
  {
    step: '2',
    title: 'Record a meeting',
    body: 'Start capture from the menu bar. Audio is written to disk—nothing streams out.',
  },
  {
    step: '3',
    title: 'Transcribe locally',
    body: 'On-device speech-to-text turns audio into text without a cloud hop.',
  },
  {
    step: '4',
    title: 'Summarize with local AI',
    body: 'Ollama drafts action items and summaries while your data stays on the same machine.',
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
  'Menu bar recording',
  'Search local transcripts',
  'Export in standard formats',
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
    <section className="ns-hero-shell">
      <div className="ns-hero-inner">
        <div className="ns-hero-grid pb-12 sm:pb-16">
          <div className="max-w-xl">
            <p className="ns-chip mb-5 inline-flex px-3 py-1">Built for macOS · Local AI</p>
            <h1 className="ns-display text-[2.5rem] sm:text-[3rem] lg:text-[3.35rem]">
              Meeting notes that stay on your Mac
            </h1>
            <p className="ns-section-lead mt-5">
              Record, transcribe, and summarize with{' '}
              <strong className="font-semibold text-[var(--color-ns-text)]">Ollama</strong>—fast to set
              up, private by default.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <DownloadButton size="large" />
              <a href="#how-it-works" className="ns-btn-secondary w-full sm:w-auto">
                See how it works
              </a>
            </div>
            <div className="ns-trust-row">
              <span>No account</span>
              <span aria-hidden>·</span>
              <span>No cloud audio upload</span>
              <span aria-hidden>·</span>
              <span>macOS 13+</span>
            </div>
          </div>
          <div className="ns-hero-shot">
            <img src={heroImage} alt="NoteStack app showing a local meeting transcript" />
          </div>
        </div>
      </div>
    </section>
  )
}

function PrivacyPillarsSection() {
  return (
    <section className="border-b border-[var(--color-ns-border)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ns-kicker">Privacy by design</p>
          <h2 className="ns-section-heading mt-2">Your voice never leaves the room</h2>
          <p className="ns-section-lead mx-auto">
            NoteStack is local-first end to end—capture, transcription, and AI all run where your
            files already live.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {privacyPillars.map((pillar) => (
            <li key={pillar.title} className="ns-card-subtle ns-card-interactive p-6">
              <div className="ns-icon-badge">
                <PillarIcon name={pillar.icon} />
              </div>
              <h3 className="mt-4 font-semibold text-[var(--color-ns-text)]">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
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
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-[var(--color-ns-border)] bg-[var(--color-ns-bg-elevated)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-14">
          <div>
            <p className="ns-kicker">How it works</p>
            <h2 className="ns-section-heading mt-2">Ollama on your Mac, not in the cloud</h2>
            <p className="ns-section-lead">
              NoteStack connects to your local Ollama instance—usually on localhost—so summaries stay
              beside your recordings.
            </p>
            <div className="ns-card-subtle mt-8 p-5 sm:p-6">
              <p className="text-sm font-semibold text-[var(--color-ns-text)]">First-time setup</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
                We detect Ollama, help you install if needed, pull a recommended model, and verify the
                connection—most people finish in under five minutes.
              </p>
            </div>
          </div>
          <ol className="space-y-3">
            {howItWorks.map((item) => (
              <li key={item.step} className="ns-step-card">
                <span className="ns-step-badge">{item.step}</span>
                <div>
                  <h3 className="font-semibold text-[var(--color-ns-text)]">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
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
    <section id="features" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ns-kicker">Compare</p>
          <h2 className="ns-section-heading mt-2">Local-first vs. typical cloud tools</h2>
          <p className="ns-section-lead mx-auto">
            Many assistants send audio upstream. NoteStack keeps the full loop on hardware you control.
          </p>
        </div>

        <ComparisonMobileList />

        <div className="ns-compare-table mt-10 hidden md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-ns-border)] bg-[var(--color-ns-chip)]">
                <th scope="col" className="w-[34%] px-6 py-4 font-semibold text-[var(--color-ns-text-muted)]">
                  Topic
                </th>
                <th scope="col" className="w-[33%] px-6 py-4 font-semibold text-[var(--color-ns-accent)]">
                  NoteStack
                </th>
                <th scope="col" className="w-[33%] px-6 py-4 font-medium text-[var(--color-ns-text-muted)]">
                  Typical cloud assistant
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b border-[var(--color-ns-border)] last:border-0">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-[var(--color-ns-text-secondary)]"
                  >
                    {row.aspect}
                  </th>
                  <td className="px-6 py-4 font-medium text-[var(--color-ns-text)] bg-[var(--color-ns-accent-soft)]/60">
                    {row.noteStack}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-ns-text-muted)]">{row.typicalCloud}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {quickFeatures.map((feature) => (
            <li
              key={feature}
              className="ns-card-subtle flex items-center gap-3 px-5 py-4 text-sm text-[var(--color-ns-text-secondary)]"
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
    <ul className="mt-10 space-y-3 md:hidden">
      {comparisonRows.map((row) => (
        <li key={row.aspect} className="ns-card-subtle overflow-hidden">
          <div className="border-b border-[var(--color-ns-border)] bg-[var(--color-ns-chip)] px-4 py-3 text-sm font-semibold text-[var(--color-ns-text)]">
            {row.aspect}
          </div>
          <div className="grid divide-y divide-[var(--color-ns-border)]">
            <div className="bg-[var(--color-ns-accent-soft)]/70 px-4 py-3">
              <p className="text-xs font-semibold text-[var(--color-ns-accent)]">NoteStack</p>
              <p className="mt-1 text-sm text-[var(--color-ns-text)]">{row.noteStack}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-[var(--color-ns-text-muted)]">Cloud</p>
              <p className="mt-1 text-sm text-[var(--color-ns-text-muted)]">{row.typicalCloud}</p>
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
      className="h-4 w-4 shrink-0 text-[var(--color-ns-accent)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DownloadSection() {
  return (
    <section id="download" className="scroll-mt-20 pb-16 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="ns-cta-band">
          <NoteStackMark size={40} className="mx-auto" variant="light" />
          <h2 className="ns-section-heading mt-4">Download NoteStack for Mac</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--color-ns-text-secondary)]">
            Set up Ollama once, then keep every transcript on your machine.
          </p>
          <div className="mt-7 flex justify-center">
            <DownloadButton size="large" />
          </div>
          <p className="mt-5 text-xs text-[var(--color-ns-text-muted)]">
            Universal build · Apple Silicon and Intel
          </p>
        </div>
      </div>
    </section>
  )
}
