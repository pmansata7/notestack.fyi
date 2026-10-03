import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  deleteTranscript,
  getSettings,
  listTranscripts,
} from "./api";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { SettingsPanel } from "./components/SettingsPanel";
import { TranscriptDetail } from "./components/TranscriptDetail";
import { TranscriptList } from "./components/TranscriptList";
import { useRecording } from "./hooks/useRecording";
import type { AppSettings, Transcript } from "./types";

type View = "main" | "settings" | "onboarding";

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function App() {
  const [view, setView] = useState<View>("main");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await listTranscripts();
    setTranscripts(list);
    if (selectedId && !list.find((t) => t.id === selectedId)) {
      setSelectedId(list[0]?.id ?? null);
    }
  }, [selectedId]);

  const onSaved = useCallback(
    (t: Transcript) => {
      setSelectedId(t.id);
      void refresh();
    },
    [refresh],
  );

  const recording = useRecording(onSaved);

  useEffect(() => {
    void (async () => {
      const s = await getSettings();
      setSettings(s);
      if (!s.onboarding_complete) setView("onboarding");
      await refresh();
    })();
  }, [refresh]);

  const selected =
    transcripts.find((t) => t.id === selectedId) ?? null;

  const handleDelete = async (id: string) => {
    await deleteTranscript(id);
    if (selectedId === id) setSelectedId(null);
    await refresh();
  };

  if (!settings) {
    return <div className="app loading">Loading…</div>;
  }

  if (view === "onboarding") {
    return (
      <div className="app">
        <OnboardingWizard
          settings={settings}
          onComplete={(s) => {
            setSettings(s);
            setView("main");
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>●</span>
          <span>Record Plus</span>
        </div>
        <nav>
          <button
            type="button"
            className={view === "main" ? "active" : "ghost"}
            onClick={() => setView("main")}
          >
            Recordings
          </button>
          <button
            type="button"
            className={view === "settings" ? "active" : "ghost"}
            onClick={() => setView("settings")}
          >
            Settings
          </button>
        </nav>
      </header>

      {view === "settings" ? (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onRerunOnboarding={() => setView("onboarding")}
        />
      ) : (
        <main className="layout">
          <aside className="sidebar">
            <div className="record-bar">
              {!recording.recording ? (
                <button
                  type="button"
                  className="record-btn"
                  onClick={() => void recording.start()}
                >
                  Record
                </button>
              ) : (
                <button
                  type="button"
                  className="record-btn stop"
                  onClick={() => void recording.stop()}
                >
                  Stop · {formatElapsed(recording.elapsedMs)}
                </button>
              )}
            </div>
            {recording.recording && (
              <div className="live-panel">
                <h3>Live transcript</h3>
                <textarea
                  rows={6}
                  value={recording.liveText}
                  onChange={(e) => recording.setLiveText(e.target.value)}
                />
                <p className="muted small">
                  Uses browser speech recognition when available; edit freely during recording.
                </p>
              </div>
            )}
            {recording.error && (
              <p className="error">{recording.error}</p>
            )}
            <TranscriptList
              items={transcripts}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={(id) => void handleDelete(id)}
            />
          </aside>
          <section className="content">
            <TranscriptDetail
              transcript={selected}
              settings={settings}
              onUpdated={(t) => {
                setTranscripts((prev) =>
                  prev.map((x) => (x.id === t.id ? t : x)),
                );
              }}
            />
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
