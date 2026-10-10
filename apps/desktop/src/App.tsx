import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  deleteTranscript,
  getSettings,
  listTranscripts,
  saveSettings,
  searchTranscripts,
} from "./api";
import { AskMeetingsPanel } from "./components/AskMeetingsPanel";
import { AssistantHub } from "./components/AssistantHub";
import { FloatingPane } from "./components/FloatingPane";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { SettingsPanel } from "./components/SettingsPanel";
import { TasksPanel } from "./components/TasksPanel";
import { TrashPanel } from "./components/TrashPanel";
import { TranscriptDetail } from "./components/TranscriptDetail";
import { TranscriptList } from "./components/TranscriptList";
import { NoteStackLogo } from "./components/NoteStackLogo";
import { NoteStackMark } from "./components/NoteStackMark";
import { useDictation } from "./hooks/useDictation";
import { useMeetingAlerts } from "./hooks/useMeetingAlerts";
import { MeetingPrompt } from "./components/MeetingPrompt";
import { useRecording } from "./hooks/useRecording";
import { normalizeSettings } from "./lib/settings";
import type { AppSettings, Transcript } from "./types";

type View =
  | "main"
  | "assistant"
  | "ask"
  | "tasks"
  | "trash"
  | "settings"
  | "onboarding";

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
  const [search, setSearch] = useState("");
  const [peekId, setPeekId] = useState<string | null>(null);
  const [paneHidden, setPaneHidden] = useState(false);

  const refresh = useCallback(async () => {
    const list = search.trim()
      ? await searchTranscripts(search.trim())
      : await listTranscripts(false);
    setTranscripts(list);
    if (selectedId && !list.find((t) => t.id === selectedId)) {
      setSelectedId(list[0]?.id ?? null);
    }
  }, [selectedId, search]);

  const onSaved = useCallback(
    (t: Transcript) => {
      setSelectedId(t.id);
      void refresh();
    },
    [refresh],
  );

  const effectiveSettings = settings ?? normalizeSettings({
    ollama_base_url: "",
    default_model: "",
    onboarding_complete: false,
    auto_enhance_on_stop: true,
    auto_instant_summary: true,
    delete_audio_after_transcribe: false,
    floating_pane_visible: true,
    meeting_reminder_minutes: 5,
    default_template_id: "general",
    calendar_events_json: "[]",
    google_oauth_client_id: "",
    meeting_popup_enabled: true,
    dictation_enabled: false,
    transcription_model: "gemma4:e4b",
    auto_transcribe_on_stop: true,
  });

  const recording = useRecording(effectiveSettings, onSaved);

  useDictation(effectiveSettings.dictation_enabled);

  const meetingAlerts = useMeetingAlerts(effectiveSettings, {
    recording: recording.recording,
  });

  useEffect(() => {
    void (async () => {
      const s = normalizeSettings(await getSettings());
      setSettings(s);
      if (!s.onboarding_complete) setView("onboarding");
      await refresh();
    })();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, refresh]);

  const selected =
    transcripts.find((t) => t.id === selectedId) ?? null;

  const handleDelete = async (id: string) => {
    await deleteTranscript(id);
    if (selectedId === id) setSelectedId(null);
    await refresh();
  };

  const persistSettings = async (s: AppSettings) => {
    const next = normalizeSettings(s);
    await saveSettings(next);
    setSettings(next);
  };

  if (!settings) {
    return (
      <div className="app loading">
        <div className="loading-shell">
          <NoteStackMark size={40} variant="light" />
          <p className="muted">Loading NoteStack…</p>
        </div>
      </div>
    );
  }

  if (view === "onboarding") {
    return (
      <div className="app">
        <main className="page-shell">
          <OnboardingWizard
            settings={settings}
            onComplete={(s) => {
              setSettings(normalizeSettings(s));
              setView("main");
            }}
          />
        </main>
      </div>
    );
  }

  const showPane =
    recording.recording &&
    settings.floating_pane_visible &&
    !paneHidden;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <NoteStackLogo height={26} className="brand-logo" />
          {recording.recording && (
            <span className="recording-pill">Recording {formatElapsed(recording.elapsedMs)}</span>
          )}
        </div>
        <nav>
          {(
            [
              ["main", "Recordings"],
              ["assistant", "Assistant"],
              ["ask", "Ask"],
              ["tasks", "Tasks"],
              ["trash", "Trash"],
              ["settings", "Settings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={view === id ? "active" : "ghost"}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {view === "settings" ? (
        <main className="page-shell">
          <SettingsPanel
            settings={settings}
            onSettingsChange={(s) => void persistSettings(s)}
            onRerunOnboarding={() => setView("onboarding")}
          />
        </main>
      ) : view === "ask" ? (
        <main className="page-shell">
          <AskMeetingsPanel settings={settings} />
        </main>
      ) : view === "tasks" ? (
        <main className="page-shell">
          <TasksPanel transcripts={transcripts} />
        </main>
      ) : view === "trash" ? (
        <main className="page-shell">
          <TrashPanel onRestored={() => void refresh()} />
        </main>
      ) : view === "assistant" ? (
        <main className="page-shell page-shell-wide">
          <AssistantHub
            settings={settings}
            transcripts={transcripts}
            onSaveSettings={(s) => void persistSettings(s)}
            onStartRecordingForEvent={(title) => {
              setView("main");
              void recording.start(title).then((id) => {
                if (id) setSelectedId(id);
              });
            }}
          />
        </main>
      ) : (
        <main className="layout">
          <aside className="sidebar">
            <p className="sidebar-section-label">Recent</p>
            <div className="record-bar">
              {!recording.recording ? (
                <button
                  type="button"
                  className="record-btn"
                  onClick={() => {
                    setPaneHidden(false);
                    void recording.start().then((id) => {
                      if (id) setSelectedId(id);
                    });
                  }}
                >
                  Take notes (no bot)
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
            {recording.transcribing && (
              <p className="status">Transcribing with Ollama…</p>
            )}
            {recording.error && (
              <p className="error">{recording.error}</p>
            )}
            {recording.recording && recording.liveSttMode === "ollama" && (
              <p className="muted small">
                {recording.liveOllamaBusy
                  ? "Updating live transcript with Ollama…"
                  : "Live transcript via Ollama (every ~10s). Needs a speech model — ollama pull gemma4:e4b."}
              </p>
            )}
            {recording.recording && recording.liveSttMode === "none" && (
              <p className="muted small">
                Recording audio. Enable &quot;Transcribe audio with Ollama when
                recording stops&quot; in Settings for live + final transcripts.
              </p>
            )}
            <TranscriptList
              items={transcripts}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={(id) => void handleDelete(id)}
              search={search}
              onSearchChange={setSearch}
            />
          </aside>
          <section className="content">
            <TranscriptDetail
              transcript={selected}
              settings={settings}
              allTranscripts={transcripts}
              peekTranscriptId={peekId}
              onPeek={setPeekId}
              activeRecording={
                recording.recording &&
                selected &&
                recording.currentId === selected.id
                  ? {
                      liveText: recording.liveText,
                      manualNotes: recording.manualNotes,
                      onLiveTextChange: recording.setLiveText,
                      onManualNotesChange: recording.setManualNotes,
                    }
                  : undefined
              }
              onUpdated={(t) => {
                setTranscripts((prev) =>
                  prev.map((x) => (x.id === t.id ? t : x)),
                );
              }}
            />
          </section>
        </main>
      )}

      {meetingAlerts.alert && !recording.recording && (
        <MeetingPrompt
          alert={meetingAlerts.alert}
          onDismiss={() => meetingAlerts.dismiss(meetingAlerts.alert!.id)}
          onTakeNotes={() => {
            const title =
              meetingAlerts.alert!.reason === "detected"
                ? meetingAlerts.alert!.title
                : meetingAlerts.alert!.title;
            meetingAlerts.dismiss(meetingAlerts.alert!.id);
            setView("main");
            setPaneHidden(false);
            void recording.start(title).then((id) => {
              if (id) setSelectedId(id);
            });
          }}
        />
      )}

      <FloatingPane
        visible={showPane}
        elapsedMs={recording.elapsedMs}
        liveTranscript={recording.liveText}
        manualNotes={recording.manualNotes}
        onManualNotesChange={recording.setManualNotes}
        onLiveTranscriptChange={recording.setLiveText}
        settings={settings}
        onClose={() => setPaneHidden(true)}
      />
    </div>
  );
}

export default App;
