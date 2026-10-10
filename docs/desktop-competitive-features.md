# Desktop feature parity map (Fireflies.ai & Granola.ai)

NoteStack implements local-first equivalents of major desktop capabilities from [Fireflies](https://fireflies.ai/desktop) and [Granola](https://www.granola.ai/). Cloud-only items (bot join, CRM push, Sales Assist KB) are stubbed or documented as future work.

## Fireflies Desktop

| Fireflies capability | NoteStack |
| --- | --- |
| Bot-free / system-audio capture | **Take notes (no bot)** — mic capture today; system audio still platform-dependent |
| Live Assist floating pane | **Live Assist** overlay: transcript, manual notes, Ask / AI skills |
| Real-time transcript | Web Speech API when available |
| Catch up / Summarize / Action items / Follow-ups | **Live skills** via Ollama |
| AskFred / `/` skills | **Ask** tab in floating pane + **Ask across meetings** |
| Instant + full summary | **Instant summary** + **Full AI notes** + auto on stop |
| Tasks | Extracted on **Enhance notes**; **Tasks** view |
| Daily Digest | **Assistant → Daily digest** |
| Meeting Prep | **Assistant → Brief** per calendar event |
| Calendar + reminders | Google Calendar OAuth sync + meeting prompt (Zoom / Teams / Meet) |
| Fireflies Talk dictation | **Settings → Dictation** (clipboard on release) |
| Trash / restore | **Trash** view |
| Search meetings | Sidebar search |
| Integrations (Slack, CRM) | **Share (copy MD)** — no OAuth yet |

## Granola Desktop

| Granola capability | NoteStack |
| --- | --- |
| AI notepad, no bot | Same **Take notes** flow |
| Manual notes + Enhance | **Manual notes** + **Enhance notes** (user vs AI styling) |
| Meeting templates | Template picker (general, 1:1, sales, etc.) |
| Brief before meeting | **Brief** in Assistant |
| Ask across meetings | **Ask** tab |
| Glance other notes in meeting | **Glance** selector in detail view |
| Delete audio, keep text | **Delete audio after transcribe** setting |
| Private by default | Local SQLite + Ollama only |

## Not yet implemented

- True system-audio / ScreenCaptureKit capture (macOS) and Windows loopback
- Microsoft Calendar OAuth
- Global always-on-top Tauri window (current pane is in-app overlay)
- Speaker diarization, pace coaching, Sales Assist KB
- Mobile / watch companions
