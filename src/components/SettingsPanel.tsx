import { useState } from "react";
import {
  getDataDir,
  ollamaCheckConnection,
  ollamaListModels,
  saveSettings,
} from "../api";
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
  const [draft, setDraft] = useState(settings);
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
      await saveSettings(draft);
      onSettingsChange(draft);
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

  return (
    <div className="panel settings">
      <h2>Settings</h2>
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
