import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useMemo, useState } from "react";
import {
  getHardwareHints,
  ollamaCheckConnection,
  ollamaListModels,
  ollamaPullModel,
  ollamaTestModel,
  saveSettings,
} from "../api";
import {
  formatDiskGb,
  modelsForHardware,
  TEXT_MODEL_OPTIONS,
  type TextModelOption,
} from "../lib/modelRecommendations";
import { normalizeSettings } from "../lib/settings";
import type { AppSettings, HardwareHints, OllamaModel } from "../types";

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
  const [customModel, setCustomModel] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [hardware, setHardware] = useState<HardwareHints | null>(null);

  const hardwareSummary = useMemo(() => {
    if (!hardware) return null;
    return modelsForHardware(hardware);
  }, [hardware]);

  useEffect(() => {
    setBaseUrl(settings.ollama_base_url);
    setModel(settings.default_model || DEFAULT_MODEL);
  }, [settings]);

  useEffect(() => {
    if (step !== 3) return;
    let cancelled = false;
    void getHardwareHints().then((hints) => {
      if (!cancelled) setHardware(hints);
    });
    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== 3 || customModel || !hardwareSummary) return;
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

  const selectPreset = (option: TextModelOption) => {
    setCustomModel(false);
    setModel(option.id);
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

  const optionFits = (option: TextModelOption) =>
    hardwareSummary?.fits.some((m) => m.id === option.id) ?? true;

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
          {status && <p className="status">{status}</p>}
          <div className="row">
            <button type="button" className="ghost" onClick={() => setStep(1)}>Back</button>
            <button type="button" onClick={() => setStep(3)}>Continue</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
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

          <fieldset className="model-options">
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
                    disabled={!fits}
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
              onChange={(e) => setCustomModel(e.target.checked)}
            />
            Use a custom model name
          </label>

          {customModel && (
            <label>
              Model to pull & use
              <input value={model} onChange={(e) => setModel(e.target.value)} />
            </label>
          )}

          <button type="button" onClick={pullModel} disabled={busy || !model.trim()}>
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
