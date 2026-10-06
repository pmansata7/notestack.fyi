import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDataDir,
  getHardwareHints,
  ollamaCheckConnection,
  ollamaInstall,
  ollamaIsInstalled,
  ollamaListModels,
  ollamaPullModel,
  ollamaTestModel,
  saveSettings,
  setStorageDirectory,
} from "../api";
import { formatInvokeError } from "../lib/errors";
import {
  formatDiskGb,
  modelsForHardware,
  TEXT_MODEL_OPTIONS,
  type TextModelOption,
} from "../lib/modelRecommendations";
import { normalizeSettings } from "../lib/settings";
import type {
  AppSettings,
  HardwareHints,
  OllamaModel,
  OllamaPullProgress,
} from "../types";

const STEPS = [
  "Welcome",
  "Storage",
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
  const [customModel, setCustomModel] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [hardware, setHardware] = useState<HardwareHints | null>(null);
  const [storageDir, setStorageDir] = useState("");
  const [ollamaInstalled, setOllamaInstalled] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const installAttempted = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadStartedAt, setDownloadStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pullProgress, setPullProgress] = useState<OllamaPullProgress | null>(null);

  const hardwareSummary = useMemo(() => {
    if (!hardware) return null;
    return modelsForHardware(hardware);
  }, [hardware]);

  useEffect(() => {
    setBaseUrl(settings.ollama_base_url);
    setModel(settings.default_model || DEFAULT_MODEL);
  }, [settings]);

  useEffect(() => {
    void (async () => {
      const dir = await getDataDir();
      setStorageDir(dir);
    })();
  }, []);

  useEffect(() => {
    if (step !== 4) return;
    let cancelled = false;
    void getHardwareHints().then((hints) => {
      if (!cancelled) setHardware(hints);
    });
    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== 4 || customModel || !hardwareSummary) return;
    if (hardwareSummary.fits.length === 0) {
      setCustomModel(true);
      setModel("llama3.2:1b");
      return;
    }
    const fitsIds = new Set(hardwareSummary.fits.map((m) => m.id));
    if (!fitsIds.has(model)) {
      setModel(hardwareSummary.suggested.id);
    }
  }, [step, customModel, hardwareSummary, model]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }
    void ensureOllamaInstalled();
  }, [step]);

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

  const goToStep = (next: number) => {
    setStatus(null);
    setStep(next);
  };

  const ensureOllamaInstalled = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const check = await ollamaIsInstalled();
      setOllamaInstalled(check.installed);
      if (check.installed) {
        setStatus(check.message);
        return;
      }
      if (installAttempted.current) {
        setStatus(check.message);
        return;
      }
      installAttempted.current = true;
      setStatus("Ollama not found — running install command…");
      const msg = await ollamaInstall();
      const after = await ollamaIsInstalled();
      setOllamaInstalled(after.installed);
      setStatus(msg);
    } catch (e) {
      setStatus(formatInvokeError(e));
      setOllamaInstalled(false);
    } finally {
      setBusy(false);
    }
  };

  const chooseStorageFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose folder for transcripts and summaries",
      defaultPath: storageDir || undefined,
    });
    if (typeof selected === "string" && selected.length > 0) {
      setStorageDir(selected);
    }
  };

  const applyStorageFolder = async () => {
    if (!storageDir.trim()) {
      setStatus("Pick a folder to continue.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const msg = await setStorageDirectory(storageDir.trim());
      setStatus(msg);
      goToStep(2);
    } catch (e) {
      setStatus(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  const retryOllamaInstall = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const msg = await ollamaInstall();
      const after = await ollamaIsInstalled();
      setOllamaInstalled(after.installed);
      setStatus(msg);
    } catch (e) {
      setStatus(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
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

  const selectPreset = (option: TextModelOption) => {
    setCustomModel(false);
    setModel(option.id);
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
      setStatus(formatInvokeError(e));
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
      setStatus(formatInvokeError(e));
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

  const optionFits = (option: TextModelOption) =>
    hardwareSummary?.fits.some((m) => m.id === option.id) ?? true;

  const stepActions = (
    back: number | null,
    forward: () => void,
    forwardLabel = "Continue",
    forwardDisabled = false,
  ) => (
    <div className="row onboarding-actions">
      {back !== null ? (
        <button type="button" className="ghost" onClick={() => goToStep(back)}>
          Back
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={forward} disabled={forwardDisabled || busy}>
        {forwardLabel}
      </button>
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
            download a text model for summaries, and verify everything works before you
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
            Transcripts, AI summaries, and audio recordings are saved under the
            folder you choose. You can change this later in Settings before your
            first meeting.
          </p>
          <label>
            Storage folder
            <input
              readOnly
              className="storage-path"
              value={storageDir}
              placeholder="Choose a folder…"
            />
          </label>
          <div className="row tight">
            <button type="button" className="secondary" onClick={chooseStorageFolder}>
              Choose folder…
            </button>
            {storageDir && (
              <button
                type="button"
                className="secondary"
                onClick={() => void openUrl(fileUrlForPath(storageDir))}
              >
                Open in Finder
              </button>
            )}
          </div>
          {status && <p className="status">{status}</p>}
          <div className="row onboarding-actions">
            <button type="button" className="ghost" onClick={() => goToStep(0)}>
              Back
            </button>
            <button
              type="button"
              onClick={applyStorageFolder}
              disabled={busy || !storageDir}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-step" aria-labelledby="onboarding-step-2">
          <h2 id="onboarding-step-2" className="onboarding-step-title">Install Ollama</h2>
          <p>
            NoteStack uses Ollama on your Mac for summaries and transcription.
            If Ollama is not installed, we run the official install command
            automatically (Homebrew on macOS when available).
          </p>
          {ollamaInstalled === false && (
            <p className="muted">
              Automatic install did not complete. You can retry or install manually,
              then open the Ollama app once so the API is available at{" "}
              <code>localhost:11434</code>.
            </p>
          )}
          <div className="row tight">
            <button
              type="button"
              className="secondary"
              onClick={() => openUrl("https://ollama.com/download")}
            >
              Open Ollama download page
            </button>
            <button type="button" onClick={retryOllamaInstall} disabled={busy}>
              {ollamaInstalled ? "Re-run install / start Ollama" : "Retry install"}
            </button>
          </div>
          {status && <p className="status">{status}</p>}
          {stepActions(1, () => goToStep(3), "Continue", busy)}
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
          <h2 id="onboarding-step-4" className="onboarding-step-title">Download model</h2>
          {hardwareSummary ? (
            <p className="muted hardware-summary">
              About <strong>{formatDiskGb(hardwareSummary.diskGbFree)}</strong> free on
              your home disk and <strong>{Math.round(hardwareSummary.ramGbTotal)} GB</strong> RAM.
              {hardwareSummary.fits.length > 0 ? (
                <>
                  {" "}
                  We suggest <strong>{hardwareSummary.suggested.label}</strong> (~
                  {hardwareSummary.suggested.downloadGb} GB download). Plan extra space for a
                  speech model later (e.g. whisper).
                </>
              ) : (
                <>
                  {" "}
                  Free space or RAM is tight for our presets—you can still enter a smaller model
                  name below.
                </>
              )}
            </p>
          ) : (
            <p className="muted">Checking disk and memory…</p>
          )}

          <fieldset className="model-options" disabled={downloading}>
            <legend>Choose a text model</legend>
            {TEXT_MODEL_OPTIONS.map((option) => {
              const fits = optionFits(option);
              return (
                <label
                  key={option.id}
                  className={`model-option${!customModel && model === option.id ? " selected" : ""}${!fits ? " disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name="text-model"
                    checked={!customModel && model === option.id}
                    disabled={!fits || downloading}
                    onChange={() => selectPreset(option)}
                  />
                  <span className="model-option-body">
                    <span className="model-option-title">
                      {option.label}
                      {!fits && <span className="model-option-badge">Needs more disk or RAM</span>}
                      {fits && option.id === hardwareSummary?.suggested.id && (
                        <span className="model-option-badge recommended">Suggested</span>
                      )}
                    </span>
                    <span className="model-option-meta">
                      ~{option.downloadGb} GB · {option.minRamGb} GB RAM min
                    </span>
                    <span className="model-option-desc">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <label className="custom-model-toggle">
            <input
              type="checkbox"
              checked={customModel}
              disabled={downloading}
              onChange={(e) => setCustomModel(e.target.checked)}
            />
            Use a custom model name
          </label>

          {customModel && (
            <label>
              Model to download & use
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={downloading}
              />
            </label>
          )}

          <button
            type="button"
            onClick={downloadModel}
            disabled={busy || downloading || !model.trim()}
          >
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
          {stepActions(3, () => goToStep(5), "Continue", downloading)}
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
