import { listen } from "@tauri-apps/api/event";
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
import type { AppSettings, OllamaModel, OllamaPullProgress } from "../types";

const STEPS = [
  "Welcome",
  "Install Ollama",
  "Connect",
  "Download model",
  "Test & finish",
] as const;

const DEFAULT_MODEL = "llama3.2";
const PULL_PROGRESS_EVENT = "ollama-pull-progress";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} GB`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} KB`;
  return `${n} B`;
}

function pullStatusLabel(status: string): string {
  switch (status) {
    case "pulling manifest":
      return "Fetching model info…";
    case "downloading":
      return "Downloading layers…";
    case "verifying sha256 digest":
      return "Verifying download…";
    case "writing manifest":
      return "Saving model…";
    case "success":
      return "Download complete";
    default:
      return status.replace(/_/g, " ");
  }
}

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
  const [downloading, setDownloading] = useState(false);
  const [downloadStartedAt, setDownloadStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pullProgress, setPullProgress] = useState<OllamaPullProgress | null>(null);

  useEffect(() => {
    setBaseUrl(settings.ollama_base_url);
    setModel(settings.default_model || DEFAULT_MODEL);
  }, [settings]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<OllamaPullProgress>(PULL_PROGRESS_EVENT, (event) => {
      setPullProgress(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (downloadStartedAt === null) return;
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - downloadStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [downloadStartedAt]);

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

  const downloadModel = async () => {
    setBusy(true);
    setDownloading(true);
    setStatus(null);
    setPullProgress(null);
    setDownloadStartedAt(Date.now());
    try {
      const msg = await ollamaPullModel(model, baseUrl);
      setStatus(msg === "success" ? `Downloaded ${model}` : msg || `Downloaded ${model}`);
      const list = await ollamaListModels(baseUrl);
      setModels(list);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setDownloading(false);
      setDownloadStartedAt(null);
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

  const completed = pullProgress?.completed ?? null;
  const total = pullProgress?.total ?? null;
  const progressPct =
    completed != null && total != null && total > 0
      ? Math.min(100, Math.round((completed / total) * 100))
      : null;

  return (
    <div className="panel onboarding">
      <h1>
        Welcome to Note<span className="gradient">Stack</span>
      </h1>
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
            This wizard helps you install Ollama, download a text model for summaries,
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
          <h2 className="step-title">Download model</h2>
          <label>
            Model to download & use (e.g. llama3.2)
            <input value={model} onChange={(e) => setModel(e.target.value)} disabled={downloading} />
          </label>
          <button type="button" onClick={downloadModel} disabled={busy}>
            {downloading ? "Downloading…" : "Download model"}
          </button>
          {downloading && (
            <div className="download-progress" aria-live="polite">
              <div className="download-progress-header">
                <span className="download-progress-label">
                  Downloading <strong>{model}</strong>
                </span>
                <span className="download-progress-timer mono">{formatElapsed(elapsedSec)}</span>
              </div>
              <div
                className={`download-progress-bar${progressPct == null ? " indeterminate" : ""}`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct ?? undefined}
              >
                {progressPct != null && (
                  <div
                    className="download-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                )}
              </div>
              <p className="muted small download-progress-detail">
                {pullProgress
                  ? pullStatusLabel(pullProgress.status)
                  : "Starting download…"}
                {completed != null && total != null && total > 0 && (
                  <>
                    {" "}
                    · {formatBytes(completed)} / {formatBytes(total)}
                    {progressPct != null && ` (${progressPct}%)`}
                  </>
                )}
              </p>
            </div>
          )}
          {models.length > 0 && (
            <p className="muted">Installed: {models.map((m) => m.name).join(", ")}</p>
          )}
          {status && !downloading && <p className="status">{status}</p>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(2)} disabled={downloading}>
              Back
            </button>
            <button type="button" onClick={() => setStep(4)} disabled={downloading}>
              Continue
            </button>
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
