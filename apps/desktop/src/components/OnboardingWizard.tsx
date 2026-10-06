import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import {
  getDataDir,
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
  "Storage",
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

function fileUrlForPath(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const encoded = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return normalized.startsWith("/") ? `file://${encoded}` : `file:///${encoded}`;
}

export function OnboardingWizard({ settings, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [baseUrl, setBaseUrl] = useState(settings.ollama_base_url);
  const [model, setModel] = useState(settings.default_model || DEFAULT_MODEL);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [connected, setConnected] = useState(false);
  const [dataDir, setDataDir] = useState<string | null>(null);

  useEffect(() => {
    setBaseUrl(settings.ollama_base_url);
    setModel(settings.default_model || DEFAULT_MODEL);
  }, [settings]);

  useEffect(() => {
    if (step !== 1) return;
    void (async () => {
      try {
        setDataDir(await getDataDir());
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [step]);

  const goToStep = (next: number) => {
    setStatus(null);
    setStep(next);
  };

  const checkConnection = async () => {
    setBusy(true);
    setStatus(null);
    setConnected(false);
    try {
      const res = await ollamaCheckConnection(baseUrl);
      setStatus(res.message);
      setConnected(res.connected);
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

  const stepActions = (back: number | null, forward: () => void, forwardLabel = "Continue") => (
    <div className="row onboarding-actions">
      {back !== null ? (
        <button type="button" className="ghost" onClick={() => goToStep(back)}>
          Back
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={forward}>{forwardLabel}</button>
    </div>
  );

  return (
    <div className="panel onboarding">
      <h1>
        Welcome to Note<span className="gradient">Stack</span>
      </h1>
      <p className="muted onboarding-lead">
        Local-first meeting notes powered by Ollama on your Mac. You choose where
        transcripts, summaries, and recordings are stored.
      </p>
      <ol className="stepper" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === step ? "active" : i < step ? "done" : ""}
          >
            {i < step ? (
              <button
                type="button"
                className="stepper-link"
                onClick={() => goToStep(i)}
              >
                {label}
              </button>
            ) : (
              label
            )}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-0">
          <p id="onboarding-step-0">
            This wizard helps you pick a storage folder, install Ollama if needed,
            pull a text model for summaries, and verify everything works before you
            record.
          </p>
          <div className="row onboarding-actions single">
            <button type="button" onClick={() => goToStep(1)}>Get started</button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-1">
          <h2 id="onboarding-step-1" className="onboarding-step-title">Storage folder</h2>
          <p>
            NoteStack keeps your database, audio recordings, and on-disk exports in
            one place. Confirm this location before continuing.
          </p>
          {dataDir ? (
            <p className="storage-path" title={dataDir}>{dataDir}</p>
          ) : (
            <p className="muted">Loading storage location…</p>
          )}
          <p className="muted small">
            Includes <code>notestack.db</code> and a <code>recordings/</code> folder
            for meeting audio.
          </p>
          <div className="row onboarding-actions">
            <button type="button" className="ghost" onClick={() => goToStep(0)}>
              Back
            </button>
            <div className="row tight">
              {dataDir && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void openUrl(fileUrlForPath(dataDir))}
                >
                  Open in Finder
                </button>
              )}
              <button
                type="button"
                disabled={!dataDir}
                onClick={() => goToStep(2)}
              >
                Use this folder
              </button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-2">
          <h2 id="onboarding-step-2" className="onboarding-step-title">Install Ollama</h2>
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
          {stepActions(1, () => goToStep(3), "I installed Ollama")}
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-3">
          <h2 id="onboarding-step-3" className="onboarding-step-title">Connect to Ollama</h2>
          <label>
            Ollama API URL
            <input
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setConnected(false);
              }}
              placeholder="http://localhost:11434"
            />
          </label>
          <button type="button" onClick={checkConnection} disabled={busy}>
            Test connection
          </button>
          {status && <p className="status">{status}</p>}
          {!connected && (
            <p className="muted small">
              Test the connection to continue. Ollama must be running at the URL above.
            </p>
          )}
          <div className="row onboarding-actions">
            <button type="button" className="ghost" onClick={() => goToStep(2)}>
              Back
            </button>
            <button
              type="button"
              disabled={!connected || busy}
              onClick={() => goToStep(4)}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-4">
          <h2 id="onboarding-step-4" className="onboarding-step-title">Pull a text model</h2>
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
          {stepActions(3, () => goToStep(5))}
        </section>
      )}

      {step === 5 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-5">
          <h2 id="onboarding-step-5" className="onboarding-step-title">Test & finish</h2>
          <p>Run a quick generation test with <strong>{model}</strong>.</p>
          <button type="button" onClick={testAndFinish} disabled={busy}>
            Test & finish setup
          </button>
          {status && <p className="status">{status}</p>}
          <div className="row onboarding-actions">
            <button type="button" className="ghost" onClick={() => goToStep(4)}>
              Back
            </button>
            <span />
          </div>
        </section>
      )}
    </div>
  );
}
