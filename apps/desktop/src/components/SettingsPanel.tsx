import { useState } from "react";
import {
  getDataDir,
  ollamaCheckConnection,
  ollamaListModels,
  saveSettings,
} from "../api";
import { MEETING_TEMPLATES } from "../types";
import { normalizeSettings } from "../lib/settings";
import type { AppSettings } from "../types";

interface Props {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onRerunOnboarding: () => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onRerunOnboarding,
}: Props) {
  const [draft, setDraft] = useState(normalizeSettings(settings));
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDataDir = async () => {
    const dir = await getDataDir();
    setDataDir(dir);
  };

  const save = async () => {
    setBusy(true);
    try {
      const next = normalizeSettings(draft);
      await saveSettings(next);
      onSettingsChange(next);
      setMessage("Settings saved.");
    } finally {
      setBusy(false);
    }
  };

  const testOllama = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await ollamaCheckConnection(draft.ollama_base_url);
      if (!res.connected) {
        setMessage(res.message);
        return;
      }
      const models = await ollamaListModels(draft.ollama_base_url);
      setMessage(
        `Connected. Models: ${models.map((m) => m.name).join(", ") || "(none)"}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = (key: keyof AppSettings) => {
    setDraft((d) => ({ ...d, [key]: !d[key] }));
  };

  return (
    <div className="panel settings">
      <h2>Settings</h2>
      <h3>Local AI</h3>
      <label>
        Ollama API URL
        <input
          value={draft.ollama_base_url}
          onChange={(e) =>
            setDraft({ ...draft, ollama_base_url: e.target.value })
          }
        />
      </label>
      <label>
        Default model
        <input
          value={draft.default_model}
          onChange={(e) =>
            setDraft({ ...draft, default_model: e.target.value })
          }
        />
      </label>
      <label>
        Transcription model (Ollama)
        <input
          value={draft.transcription_model}
          onChange={(e) =>
            setDraft({ ...draft, transcription_model: e.target.value })
          }
          placeholder="whisper"
        />
      </label>
      <p className="muted small">
        Used after recording when live captions are unavailable. Run{" "}
        <code>ollama pull whisper</code> (or an audio-capable model like{" "}
        <code>gemma4:e4b</code>).
      </p>

      <h3>Meeting capture (Granola / Fireflies parity)</h3>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.auto_transcribe_on_stop}
          onChange={() => toggle("auto_transcribe_on_stop")}
        />
        Transcribe audio with Ollama when recording stops
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.auto_instant_summary}
          onChange={() => toggle("auto_instant_summary")}
        />
        Instant summary when recording stops
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.auto_enhance_on_stop}
          onChange={() => toggle("auto_enhance_on_stop")}
        />
        Auto-enhance notes when recording stops
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.delete_audio_after_transcribe}
          onChange={() => toggle("delete_audio_after_transcribe")}
        />
        Delete audio after transcribe (text-only retention)
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.floating_pane_visible}
          onChange={() => toggle("floating_pane_visible")}
        />
        Show Live Assist floating pane while recording
      </label>
      <label>
        Default meeting template
        <select
          value={draft.default_template_id}
          onChange={(e) =>
            setDraft({ ...draft, default_template_id: e.target.value })
          }
        >
          {MEETING_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>
      <label>
        Calendar reminder (minutes before)
        <input
          type="number"
          min={0}
          max={60}
          value={draft.meeting_reminder_minutes}
          onChange={(e) =>
            setDraft({
              ...draft,
              meeting_reminder_minutes: Number(e.target.value) || 0,
            })
          }
        />
      </label>

      <h3>Dictation (Fireflies Talk)</h3>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.dictation_enabled}
          onChange={() => toggle("dictation_enabled")}
        />
        Enable hold-to-dictate (Fn on Mac, Ctrl+Win on Windows) — copies to clipboard
      </label>
      <p className="muted small">
        Dictation stays on-device; nothing is uploaded. Paste into any app after release.
      </p>

      <div className="row">
        <button type="button" onClick={save} disabled={busy}>Save</button>
        <button type="button" className="secondary" onClick={testOllama} disabled={busy}>
          Test Ollama
        </button>
        <button type="button" className="ghost" onClick={onRerunOnboarding}>
          Run setup wizard again
        </button>
      </div>
      <div className="row">
        <button type="button" className="ghost" onClick={loadDataDir}>
          Show data directory
        </button>
      </div>
      {dataDir && <p className="muted mono">Data: {dataDir}</p>}
      {message && <p className="status">{message}</p>}
    </div>
  );
}
