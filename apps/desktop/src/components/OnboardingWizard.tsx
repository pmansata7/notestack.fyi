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
  "Download model",
  "Test & finish",
] as const;

const DEFAULT_MODEL = "llama3.2";

type StatusKind = "info" | "success" | "error";

function displayModelName(name: string): string {
  return name.replace(/:latest$/, "");
}

function StatusBanner({
  kind,
  children,
}: {
  kind: StatusKind;
  children: string;
}) {
  return (
    <p className={`status status--${kind}`} role="status">
      {children}
    </p>
  );
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
  const [statusKind, setStatusKind] = useState<StatusKind>("info");
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
      if (res.connected) {
        setStatusKind("success");
        setStatus("Connected to Ollama. You can continue to download a model.");
        const list = await ollamaListModels(baseUrl);
        setModels(list);
      } else {
        setStatusKind("error");
        setStatus(
          res.message.includes("Connection")
            ? "We couldn't reach Ollama. Make sure the Ollama app is running, then try again."
            : res.message,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const pullModel = async () => {
    setBusy(true);
    setStatusKind("info");
    setStatus(
      `Downloading ${displayModelName(model)}… First-time downloads can take several minutes.`,
    );
    try {
      await ollamaPullModel(model, baseUrl);
      const list = await ollamaListModels(baseUrl);
      setModels(list);
      setStatusKind("success");
      setStatus(
        `${displayModelName(model)} is ready. Continue to run a quick test.`,
      );
    } catch (e) {
      setStatusKind("error");
      setStatus(
        e instanceof Error
          ? e.message
          : "Something went wrong while downloading the model. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const testAndFinish = async () => {
    setBusy(true);
    setStatusKind("info");
    setStatus("Running a quick test with your model…");
    try {
      const reply = await ollamaTestModel(model, baseUrl);
      setStatusKind("success");
      setStatus(
        reply.trim()
          ? `All set! Your model replied: “${reply.trim()}”`
          : "All set! Your model is working.",
      );
      const next: AppSettings = normalizeSettings({
        ...settings,
        ollama_base_url: baseUrl,
        default_model: model,
        onboarding_complete: true,
      });
      await saveSettings(next);
      onComplete(next);
    } catch (e) {
      setStatusKind("error");
      setStatus(
        e instanceof Error
          ? e.message
          : "The test didn't succeed. Check that the model name is correct and Ollama is running.",
      );
    } finally {
      setBusy(false);
    }
  };

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
          {status && <StatusBanner kind={statusKind}>{status}</StatusBanner>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(1)}>Back</button>
            <button type="button" onClick={() => setStep(3)}>Continue</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <label>
            Model to download & use (e.g. llama3.2)
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
          <button type="button" onClick={pullModel} disabled={busy}>
            {busy ? "Downloading…" : "Download model"}
          </button>
          {models.length > 0 && (
            <div className="installed-models">
              <p className="muted small">Already on your Mac</p>
              <ul className="model-chips">
                {models.map((m) => (
                  <li key={m.name}>{displayModelName(m.name)}</li>
                ))}
              </ul>
            </div>
          )}
          {status && <StatusBanner kind={statusKind}>{status}</StatusBanner>}
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
          {status && <StatusBanner kind={statusKind}>{status}</StatusBanner>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(3)}>Back</button>
          </div>
        </section>
      )}
    </div>
  );
}
