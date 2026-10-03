# NoteStack (`notestack.fyi`)

**NoteStack** is the home for **Record Plus** — a privacy-first, local-first meeting notes stack. Record voice, keep transcripts on your device, and summarize with **Ollama** on `localhost` (no cloud required for core workflows).

## Monorepo

| Path | Description |
|------|-------------|
| [`apps/desktop/`](apps/desktop/) | **Record Plus** — Tauri 2 + React macOS desktop app (recording, transcripts, Ollama onboarding, meeting notes) |

## Quick start (desktop)

```bash
cd apps/desktop
npm install
npm run tauri dev
```

See [apps/desktop/README.md](apps/desktop/README.md) for macOS prerequisites (Rust 1.90+, Node, Ollama) and production build notes.

## Principles

- **Local storage** — SQLite + audio under your app data directory  
- **Local AI** — summaries via Ollama; you choose the model  
- **No account** — MVP has no sync or telemetry backends  

## License

Add a license before public distribution.
