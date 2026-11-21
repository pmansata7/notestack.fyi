import { DownloadButton } from '../components/DownloadButton'
import { MeetingNotepadPreview } from '../components/MeetingNotepadPreview'
import { NoteStackMark } from '../components/NoteStackMark'

const ethos = [
  {
    title: 'No meeting bot',
    description: 'Capture from your Mac while you stay in the room—nothing dials in on your behalf.',
  },
  {
    title: 'Private by default',
    description: 'Audio, transcripts, and AI runs stay on your machine. Share only when you choose.',
  },
  {
    title: 'Works with your stack',
    description: 'Zoom, Meet, Teams, or in-person—one notepad for every conversation.',
  },
]

const lifecycle = [
  {
    phase: 'Before',
    title: 'Start prepared',
    body: 'Calendar sync surfaces upcoming meetings. Brief pulls context from past local notes—who’s in the room and what you already agreed.',
    items: ['Meeting brief from history', 'Template for 1:1s, sales, general', 'Prompt when a call starts'],
  },
  {
    phase: 'During',
    title: 'Listen, jot, enhance',
    body: 'Write the bullets you care about. NoteStack transcribes locally and can merge your notes with the transcript—Granola-style, without sending audio upstream.',
    items: ['Manual notes + live transcript', 'Enhance notes with local AI', 'Optional Live Assist pane'],
  },
  {
    phase: 'After',
    title: 'Admin, handled',
    body: 'Summaries, tasks, and follow-ups are ready when you stop recording. Ask across meetings or export markdown—you own the files.',
    items: ['Instant + full summaries', 'Task extraction', 'Ask across your library', 'Trash & restore'],
  },
]

const capabilities = [
  'Menu bar capture',
  'Enhance your bullets with AI',
  'Meeting templates',
  'Search all transcripts',
  'Delete audio, keep text',
  'Ollama on localhost',
]

const privacyPoints = [
  {
    title: 'Audio never uploads',
    text: 'Recordings are written to disk on your Mac. NoteStack does not stream meetings to our servers.',
  },
  {
    title: 'Transcripts you own',
    text: 'SQLite on device. Export, back up, or wipe whenever you want—no vendor retention policy.',
  },
  {
    title: 'AI stays local',
    text: 'Summaries and Ask use Ollama on your hardware. No cloud LLM API key required for core workflows.',
  },
]

export function HomePage() {
  return (
    <>
      <HeroSection />
      <EthosSection />
      <LifecycleSection />
      <CapabilitiesSection />
      <PrivacySection />
      <DownloadSection />
    </>
  )
}

function HeroSection() {
  return (
    <section className="ns-hero-shell">
      <div className="ns-hero-inner">
        <div className="ns-hero-grid pb-14 sm:pb-20">
          <div className="max-w-xl">
            <p className="ns-chip mb-5 inline-flex px-3 py-1">AI notepad · macOS · Local-first</p>
            <h1 className="ns-display text-[2.65rem] sm:text-[3.1rem] lg:text-[3.5rem]">
              Meeting notes without the cloud
            </h1>
            <p className="ns-section-lead mt-5 text-[1.0625rem] sm:text-[1.125rem]">
              Granola-style flow—briefs, bullets, enhance, and ask—powered by{' '}
              <strong className="font-semibold text-[var(--color-ns-text)]">Ollama on your Mac</strong>.
              Your voice stays in the room.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <DownloadButton size="large" />
              <a href="#how-it-works" className="ns-btn-secondary w-full sm:w-auto">
                See the flow
              </a>
            </div>
            <div className="ns-trust-row">
              <span>No account</span>
              <span aria-hidden>·</span>
              <span>No cloud audio</span>
              <span aria-hidden>·</span>
              <span>macOS 13+</span>
            </div>
          </div>
          <div className="ns-hero-preview">
            <MeetingNotepadPreview />
            <p className="mt-3 text-center text-xs text-[var(--color-ns-text-muted)]">
              Illustrative UI — same enhance-notes pattern as the desktop app
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function EthosSection() {
  return (
    <section className="border-b border-[var(--color-ns-border)] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ns-kicker">Effortless notes, enhanced on device</p>
          <h2 className="ns-section-heading mt-2">Back-to-back meetings, one private notepad</h2>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {ethos.map((item) => (
            <li key={item.title} className="ns-card-subtle p-6">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--color-ns-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function LifecycleSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-[var(--color-ns-border)] bg-[var(--color-ns-bg-warm)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="ns-kicker">Before · During · After</p>
        <h2 className="ns-section-heading mt-2 max-w-xl">How NoteStack fits your day</h2>
        <p className="ns-section-lead mt-3 max-w-2xl">
          The same rhythm you expect from modern AI notepads—implemented so inference never leaves
          your Mac.
        </p>
        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {lifecycle.map((block) => (
            <li key={block.phase} className="ns-lifecycle-card">
              <span className="ns-lifecycle-phase">{block.phase}</span>
              <h3 className="mt-3 text-xl font-semibold text-[var(--color-ns-text)]">{block.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
                {block.body}
              </p>
              <ul className="mt-4 space-y-2">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm text-[var(--color-ns-text-secondary)] before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--color-ns-accent)] before:content-['']"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CapabilitiesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="ns-kicker">Desktop parity</p>
            <h2 className="ns-section-heading mt-2">Granola-style power, offline-friendly</h2>
            <p className="ns-section-lead">
              Templates, briefs, enhance-notes, Ask across meetings, and calendar prompts—built for
              people who want AI notes without handing their audio to someone else’s GPU farm.
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-center gap-2 rounded-[var(--radius-ns)] border border-[var(--color-ns-border)] bg-[var(--color-ns-surface)] px-4 py-3 text-sm text-[var(--color-ns-text)]"
              >
                <CheckIcon />
                {cap}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function PrivacySection() {
  return (
    <section className="border-y border-[var(--color-ns-border)] bg-[var(--color-ns-bg-elevated)] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ns-kicker">Privacy</p>
          <h2 className="ns-section-heading mt-2">Private by default—structurally, not just in copy</h2>
          <p className="ns-section-lead mx-auto">
            Cloud notepads are convenient until compliance asks where the recording went. NoteStack
            keeps the loop on hardware you control.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {privacyPoints.map((point) => (
            <li key={point.title} className="ns-card-subtle p-6">
              <h3 className="font-semibold text-[var(--color-ns-text)]">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ns-text-secondary)]">
                {point.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DownloadSection() {
  return (
    <section id="download" className="scroll-mt-20 pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="ns-cta-band">
          <NoteStackMark size={40} className="mx-auto" variant="light" />
          <h2 className="ns-section-heading mt-4">Download NoteStack for Mac</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--color-ns-text-secondary)]">
            Install once, pull an Ollama model, and keep every enhanced note on your machine.
          </p>
          <div className="mt-7 flex justify-center">
            <DownloadButton size="large" />
          </div>
          <p className="mt-5 text-xs text-[var(--color-ns-text-muted)]">
            Universal build · Apple Silicon and Intel · Free while in beta
          </p>
        </div>
      </div>
    </section>
  )
}