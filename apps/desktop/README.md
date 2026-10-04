# Record Plus

Local-first meeting recorder for macOS (Tauri 2 + React). Capture microphone audio, store transcripts and recordings on disk, and generate meeting notes with [Ollama](https://ollama.com) on `localhost:11434`.

## Features

Desktop parity with **Fireflies** and **Granola** (local-first) — see [docs/desktop-competitive-features.md](../../docs/desktop-competitive-features.md).

- **Take notes (no bot)** — record + live transcript; Live Assist floating pane (transcript, manual notes, AI skills)
- **Enhance notes** — Granola-style merge of your bullets + transcript (Ollama)
- **Instant summary**, full AI notes, **tasks**, **daily digest**, **meeting briefs**
- **Ask across meetings** — chat over local history
- **Search**, **trash/restore**, meeting **templates**, calendar reminders (local events)
- **Dictation** (Fireflies Talk–style) — hold Fn / Ctrl+Win, copies to clipboard
- SQLite + audio under `~/Library/Application Support/Record Plus/`
- **Ollama onboarding wizard** and all AI via `localhost` Ollama

## Prerequisites (macOS)

1. **Xcode Command Line Tools**  
   `xcode-select --install`

2. **Node.js** 20+ and npm

3. **Rust** 1.90+ (Tauri 2.12)  
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup update stable
   ```

4. **Ollama** (for summaries)  
   Install from [ollama.com/download](https://ollama.com/download), open the app once, then e.g. `ollama pull llama3.2`.

## Development

```bash
cd apps/desktop   # from repo root
npm install
npm run tauri dev
```

The Vite dev server runs on port **1420**; Tauri opens the desktop window.

### Useful scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Frontend only (browser; Tauri APIs unavailable) |
| `npm run build` | Production frontend build |
| `npm run tauri dev` | Desktop app with hot reload |
| `npm run tauri build` | Release `.app` / `.dmg` (macOS) |

## Data layout

| Path | Purpose |
|------|---------|
| `~/Library/Application Support/Record Plus/record-plus.db` | SQLite: transcripts, settings |
| `~/Library/Application Support/Record Plus/recordings/` | Audio files (`{id}.webm`) |

## Architecture

High-level design is documented in the Record App project store at `docs/desktop-app.md` (Tauri commands, SQLite schema, Ollama flow).

Rust modules: `db`, `ollama`, `commands`, `state`. React: `OnboardingWizard`, `SettingsPanel`, `TranscriptList`, `TranscriptDetail`, `useRecording`.

## Production Mac build gaps

- **Code signing & notarization** for distribution outside your machine
- **System audio / meeting capture** — MVP records microphone only; capturing other apps requires ScreenCaptureKit or a virtual device (e.g. BlackHole)
- **Fully local STT** — live text uses Web Speech when available; offline Whisper (or similar) is not bundled yet
- **Ollama lifecycle** — app assumes Ollama is installed and running; no embedded model runtime
- **Auto-update, crash reporting, menu bar / tray UX** not implemented
- **Linux/Windows** — untested; macOS is the target platform

## License

Private / unlicensed MVP scaffold — add a license before public release.
