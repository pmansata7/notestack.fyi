import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import {
  ollamaCheckConnection,
  ollamaListModels,
  ollamaPullModel,
  ollamaTestModel,
  saveSettings,
} from "../api";
import { normalizeSettings } from "../lib/settings";
import type { AppSettings, OllamaModel } from "../types";

const STEPS = [
  "Welcome",
  "Install Ollama",
  "Connect",
  "Pull model",
  "Test & finish",
] as const;

const DEFAULT_MODEL = "llama3.2";

interface Props {
  settings: AppSettings;
  onComplete: (settings: AppSettings) => void;
}

export function OnboardingWizard({ settings, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [baseUrl, setBaseUrl] = useState(settings.ollama_base_url);
  const [model, setModel] = useState(settings.default_model || DEFAULT_MODEL);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);

  useEffect(() => {
    setBaseUrl(settings.ollama_base_url);
    setModel(settings.default_model || DEFAULT_MODEL);
  }, [settings]);

  const checkConnection = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await ollamaCheckConnection(baseUrl);
      setStatus(res.message);
      if (res.connected) {
        const list = await ollamaListModels(baseUrl);
        setModels(list);
      }
    } finally {
      setBusy(false);
    }
  };

  const pullModel = async () => {
    setBusy(true);
    setStatus("Pulling model (this may take several minutes)…");
    try {
      const msg = await ollamaPullModel(model, baseUrl);
      setStatus(msg || `Pulled ${model}`);
      const list = await ollamaListModels(baseUrl);
      setModels(list);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const testAndFinish = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const reply = await ollamaTestModel(model, baseUrl);
      setStatus(reply);
      const next: AppSettings = normalizeSettings({
        ...settings,
        ollama_base_url: baseUrl,
        default_model: model,
        onboarding_complete: true,
      });
      await saveSettings(next);
      onComplete(next);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel onboarding">
      <h1>Welcome to Record Plus</h1>
      <p className="muted">
        Local-first meeting notes powered by Ollama on your Mac. Your recordings
        and transcripts stay in your app data folder.
      </p>
      <ol className="stepper">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "active" : i < step ? "done" : ""}>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <p>
            This wizard helps you install Ollama, pull a text model for summaries,
            and verify everything works before you record.
          </p>
          <button type="button" onClick={() => setStep(1)}>Get started</button>
        </section>
      )}

      {step === 1 && (
        <section>
          <p>
            Install Ollama from the official site, then open the Ollama app once
            so the API is available at <code>localhost:11434</code>.
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => openUrl("https://ollama.com/download")}
          >
            Open Ollama download page
          </button>
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(0)}>Back</button>
            <button type="button" onClick={() => setStep(2)}>I installed Ollama</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <label>
            Ollama API URL
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
          </label>
          <button type="button" onClick={checkConnection} disabled={busy}>
            Test connection
          </button>
          {status && <p className="status">{status}</p>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(1)}>Back</button>
            <button type="button" onClick={() => setStep(3)}>Continue</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <label>
            Model to pull & use (e.g. llama3.2)
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
          <button type="button" onClick={pullModel} disabled={busy}>
            Pull model
          </button>
          {models.length > 0 && (
            <p className="muted">Installed: {models.map((m) => m.name).join(", ")}</p>
          )}
          {status && <p className="status">{status}</p>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(2)}>Back</button>
            <button type="button" onClick={() => setStep(4)}>Continue</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <p>Run a quick generation test with <strong>{model}</strong>.</p>
          <button type="button" onClick={testAndFinish} disabled={busy}>
            Test & finish setup
          </button>
          {status && <p className="status">{status}</p>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(3)}>Back</button>
          </div>
        </section>
      )}
    </div>
  );
}
