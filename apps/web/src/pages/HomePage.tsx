import heroImage from '../assets/hero.png'
import { DownloadButton } from '../components/DownloadButton'
import { NoteStackMark } from '../components/NoteStackMark'

const privacyPillars = [
  {
    index: '01',
    title: 'Audio stays on your Mac',
    description:
      'Recordings are captured and processed locally. Nothing is uploaded for transcription.',
    icon: 'shield',
  },
  {
    index: '02',
    title: 'Transcripts on device',
    description: 'Notes live in local storage. Export, share, or delete on your terms.',
    icon: 'disk',
  },
  {
    index: '03',
    title: 'Local models via Ollama',
    description: 'Summaries run through Ollama on your machine—no remote LLM API keys required.',
    icon: 'cpu',
  },
  {
    index: '04',
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
    <section className="border-b border-[var(--color-ns-border-strong)]">
      <div className="ns-hero-grid">
        <div className="ns-hero-panel flex flex-col justify-between px-6 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div>
            <p className="ns-kicker mb-8">Local AI · macOS · No upload</p>
            <h1 className="ns-display text-[2.75rem] sm:text-[3.25rem] lg:text-[3.75rem]">
              Meeting notes
              <br />
              <span className="italic text-[#f0ddd5]">that never leave</span>
              <br />
              your Mac
            </h1>
            <p className="ns-section-lead mt-8 max-w-md">
              NoteStack records, transcribes, and summarizes with{' '}
              <strong className="font-semibold text-[#faf8f3]">Ollama</strong>—the whole loop on your
              hardware.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <DownloadButton size="large" />
              <a href="#how-it-works" className="ns-btn-secondary w-full border-[#5c5850] text-[#e8e2d6] sm:w-auto">
                How it works
              </a>
            </div>
          </div>
          <p className="mt-12 text-xs leading-relaxed text-[#8a8478]">
            macOS 13+ and Ollama · No account · Audio stays local
          </p>
        </div>
        <div className="ns-hero-media">
          <img src={heroImage} alt="NoteStack app showing a local meeting transcript" />
        </div>
      </div>
    </section>
  )
}

function PrivacyPillarsSection() {
  return (
    <section className="border-b border-[var(--color-ns-border-strong)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="ns-kicker mb-4">Architecture</p>
          <h2 className="ns-section-heading">Privacy isn&apos;t a feature toggle</h2>
          <p className="ns-section-lead">
            Every layer is built so your voice and words stay on the machine you already trust.
          </p>
        </div>
        <ul className="mt-14 grid gap-px border border-[var(--color-ns-border-strong)] bg-[var(--color-ns-border-strong)] sm:grid-cols-2 lg:grid-cols-4">
          {privacyPillars.map((pillar) => (
            <li key={pillar.title} className="ns-card-subtle ns-card-interactive flex flex-col p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <span className="ns-index-label">{pillar.index}</span>
                <div className="ns-icon-badge">
                  <PillarIcon name={pillar.icon} />
                </div>
              </div>
              <h3 className="mt-6 font-semibold text-[var(--color-ns-text)]">{pillar.title}</h3>
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
    <section id="how-it-works" className="scroll-mt-20 border-b border-[var(--color-ns-border-strong)] bg-[var(--color-ns-bg-elevated)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="ns-kicker mb-4">Workflow</p>
            <h2 className="ns-section-heading">Ollama on your LAN, not theirs</h2>
            <p className="ns-section-lead">
              NoteStack talks to the Ollama instance on your Mac—typically localhost—not a hosted API.
            </p>
            <div className="ns-card mt-10 border-[var(--color-ns-accent)] bg-[var(--color-ns-accent-soft)] p-6">
              <p className="ns-kicker text-[var(--color-ns-accent)]">First launch</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
                We detect Ollama, guide install if needed, pull a recommended model, and verify the
                connection—usually under five minutes on Apple Silicon or Intel.
              </p>
            </div>
          </div>
          <ol className="space-y-0 border border-[var(--color-ns-border-strong)]">
            {howItWorks.map((item, i) => (
              <li
                key={item.step}
                className={`flex gap-5 border-[var(--color-ns-border-strong)] bg-[var(--color-ns-surface)] p-6 sm:p-7 ${i > 0 ? 'border-t' : ''}`}
              >
                <span className="ns-step-badge">{item.step}</span>
                <div>
                  <h3 className="font-semibold text-[var(--color-ns-text)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
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
        <div className="max-w-xl">
          <p className="ns-kicker mb-4">Compare</p>
          <h2 className="ns-section-heading">Local-first vs. cloud assistants</h2>
          <p className="ns-section-lead">
            Cloud tools trade control for convenience. NoteStack keeps AI on your hardware instead.
          </p>
        </div>

        <ComparisonMobileList />

        <div className="mt-12 hidden overflow-hidden border border-[var(--color-ns-border-strong)] md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-ns-border-strong)] bg-[var(--color-ns-ink)] text-[#e8e2d6]">
                <th scope="col" className="w-[34%] px-6 py-4 font-mono text-xs font-medium uppercase tracking-wider">
                  Topic
                </th>
                <th scope="col" className="w-[33%] px-6 py-4 font-semibold">
                  NoteStack
                </th>
                <th scope="col" className="w-[33%] px-6 py-4 font-medium text-[#a39e92]">
                  Typical cloud assistant
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--color-ns-surface)]">
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b border-[var(--color-ns-border)] last:border-0">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-[var(--color-ns-text-secondary)]"
                  >
                    {row.aspect}
                  </th>
                  <td className="px-6 py-4 font-medium text-[var(--color-ns-text)] bg-[var(--color-ns-accent-soft)]">
                    {row.noteStack}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-ns-text-muted)]">{row.typicalCloud}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-3">
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
    <ul className="mt-10 space-y-4 md:hidden">
      {comparisonRows.map((row) => (
        <li key={row.aspect} className="overflow-hidden border border-[var(--color-ns-border-strong)]">
          <div className="border-b border-[var(--color-ns-border-strong)] bg-[var(--color-ns-ink)] px-4 py-3 text-sm font-medium text-[#e8e2d6]">
            {row.aspect}
          </div>
          <div className="grid divide-y divide-[var(--color-ns-border)]">
            <div className="bg-[var(--color-ns-accent-soft)] px-4 py-3">
              <p className="ns-kicker text-[var(--color-ns-accent)]">NoteStack</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ns-text)]">{row.noteStack}</p>
            </div>
            <div className="bg-[var(--color-ns-surface)] px-4 py-3">
              <p className="ns-kicker">Cloud</p>
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
    <section id="download" className="scroll-mt-20 border-t border-[var(--color-ns-border-strong)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="border border-[var(--color-ns-border-strong)] bg-[var(--color-ns-ink)] px-6 py-14 text-center text-[#e8e2d6] sm:px-12 sm:py-16">
          <NoteStackMark size={40} className="mx-auto opacity-90" variant="dark" />
          <h2 className="ns-display mt-6 text-3xl sm:text-4xl">Take the room offline</h2>
          <p className="mx-auto mt-4 max-w-md text-[#c9c2b4]">
            Download for Mac, set up Ollama once, and keep every transcript where it belongs.
          </p>
          <div className="mt-8 flex justify-center">
            <DownloadButton size="large" />
          </div>
          <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-wider text-[#8a8478]">
            Universal · Apple Silicon & Intel
          </p>
        </div>
      </div>
    </section>
  )
}
