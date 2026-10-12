import { useEffect, useMemo, useState } from "react";
import {
  enhanceNotes,
  generateInstantSummary,
  generateNotes,
  transcribeRecordingAudio,
  updateTranscript,
} from "../api";
import { FormattedTranscript } from "./FormattedTranscript";
import { NoteStackMark } from "./NoteStackMark";
import { hasSpeakerLabels } from "../lib/transcriptText";
import {
  MEETING_TEMPLATES,
  type AppSettings,
  type MeetingTask,
  type Transcript,
} from "../types";

interface ActiveRecordingProps {
  liveText: string;
  manualNotes: string;
  onLiveTextChange: (v: string) => void;
  onManualNotesChange: (v: string) => void;
}

interface Props {
  transcript: Transcript | null;
  settings: AppSettings;
  onUpdated: (t: Transcript) => void;
  peekTranscriptId: string | null;
  onPeek: (id: string | null) => void;
  allTranscripts: Transcript[];
  activeRecording?: ActiveRecordingProps;
}

function parseTasks(json: string): MeetingTask[] {
  try {
    const raw = JSON.parse(json) as MeetingTask[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function TranscriptDetail({
  transcript,
  settings,
  onUpdated,
  peekTranscriptId,
  onPeek,
  allTranscripts,
  activeRecording,
}: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [manual, setManual] = useState("");
  const [aiAdditions, setAiAdditions] = useState("");
  const [instant, setInstant] = useState("");
  const [templateId, setTemplateId] = useState("general");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const peek = useMemo(
    () => allTranscripts.find((t) => t.id === peekTranscriptId) ?? null,
    [allTranscripts, peekTranscriptId],
  );

  useEffect(() => {
    if (!transcript) return;
    if (activeRecording) {
      setText(activeRecording.liveText);
      setManual(activeRecording.manualNotes);
      return;
    }
    setTitle(transcript.title);
    setText(transcript.transcript_text);
    setManual(transcript.manual_notes);
    setAiAdditions(transcript.ai_additions);
    setInstant(transcript.instant_summary);
    setTemplateId(transcript.template_id || "general");
    setMessage(null);
  }, [transcript, activeRecording]);

  useEffect(() => {
    if (!activeRecording) return;
    setText(activeRecording.liveText);
    setManual(activeRecording.manualNotes);
  }, [activeRecording]);

  if (!transcript) {
    return (
      <div className="detail empty">
        <NoteStackMark size={48} variant="light" />
        <h2 className="gemini-greeting">Your notepad</h2>
        <p>Start a meeting note and type while you listen — transcript and AI enhancements stay on your Mac.</p>
      </div>
    );
  }

  const isLive = Boolean(activeRecording);
  const showFormattedTranscript =
    isLive || hasSpeakerLabels(text) || text.includes("\n");

  const tasks = parseTasks(transcript.tasks_json);

  const save = async () => {
    setBusy(true);
    try {
      const t = await updateTranscript({
        id: transcript.id,
        title,
        transcript_text: text,
        manual_notes: manual,
        ai_additions: aiAdditions,
        instant_summary: instant,
        template_id: templateId,
      });
      onUpdated(t);
      setMessage("Saved.");
    } finally {
      setBusy(false);
    }
  };

  const genNotes = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const t = await generateNotes(transcript.id, settings.default_model);
      onUpdated(t);
      setMessage("Full meeting notes generated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const enhance = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await updateTranscript({
        id: transcript.id,
        manual_notes: manual,
        transcript_text: text,
        template_id: templateId,
      });
      const t = await enhanceNotes(transcript.id, settings.default_model);
      setAiAdditions(t.ai_additions);
      onUpdated(t);
      setMessage("Notes enhanced — your text stays black, AI in gray below.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const transcribeFromAudio = async () => {
    if (!transcript.audio_path) {
      setMessage("No audio file for this recording.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const t = await transcribeRecordingAudio(
        transcript.id,
        settings.transcription_model,
      );
      setText(t.transcript_text);
      onUpdated(t);
      setMessage("Transcript generated from audio.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const instantSummary = async () => {
    setBusy(true);
    try {
      const t = await generateInstantSummary(
        transcript.id,
        settings.default_model,
      );
      setInstant(t.instant_summary);
      onUpdated(t);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportMarkdown = () => {
    const md = `# ${title}\n\n## Instant summary\n${instant}\n\n## Your notes\n${manual}\n\n## AI additions\n${aiAdditions}\n\n## Transcript\n${text}\n`;
    void navigator.clipboard.writeText(md);
    setMessage("Copied markdown to clipboard.");
  };

  return (
    <div className={`detail${isLive ? " detail--live" : ""}`}>
      {peek && peek.id !== transcript.id && (
        <aside className="peek-panel">
          <header>
            <strong>Glance: {peek.title}</strong>
            <button type="button" className="ghost small" onClick={() => onPeek(null)}>
              Close
            </button>
          </header>
          <p className="muted small">{peek.instant_summary || peek.notes_text.slice(0, 280)}</p>
        </aside>
      )}

      {!isLive && (
        <label className="field-compact">
          Template
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {MEETING_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field-title">
        {isLive ? "Meeting" : "Title"}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isLive ? "Untitled meeting" : "Title"}
        />
      </label>

      {instant && !isLive && (
        <section className="instant-summary">
          <h3>Summary</h3>
          <pre>{instant}</pre>
        </section>
      )}

      <section className="notes-primary">
        <label>
          {isLive ? "Your notes" : "Notes"}
          <textarea
            rows={isLive ? 14 : 8}
            className="manual-notes notes-editor"
            value={manual}
            onChange={(e) => {
              setManual(e.target.value);
              activeRecording?.onManualNotesChange(e.target.value);
            }}
            placeholder="Type what matters — bullets, decisions, names."
            autoFocus={isLive}
          />
        </label>
      </section>

      {aiAdditions && !isLive && (
        <label>
          AI additions
          <textarea
            rows={6}
            className="ai-notes"
            value={aiAdditions}
            onChange={(e) => setAiAdditions(e.target.value)}
          />
        </label>
      )}

      <section className="transcript-section">
        <div className="transcript-section-header">
          <h3>Transcript</h3>
          {isLive && (
            <span className="muted small">Speakers labeled when you end the meeting</span>
          )}
        </div>
        {showFormattedTranscript && (
          <div className="transcript-readout">
            <FormattedTranscript text={text} compact={isLive} />
          </div>
        )}
        {!isLive && (
          <label className="field-compact">
            Edit transcript
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Transcribe from audio or paste text."
            />
          </label>
        )}
      </section>

      {tasks.length > 0 && (
        <section className="inline-tasks">
          <h3>Action items</h3>
          <ul>
            {tasks.map((task, i) => (
              <li key={i}>{task.title}</li>
            ))}
          </ul>
        </section>
      )}

      {!isLive && (
      <div className="row">
        {transcript.audio_path && !text.trim() && !activeRecording && (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void transcribeFromAudio()}
          >
            Transcribe from audio
          </button>
        )}
        <button type="button" onClick={save} disabled={busy}>Save</button>
        <button type="button" className="secondary" onClick={enhance} disabled={busy}>
          Enhance notes
        </button>
        <button type="button" className="secondary" onClick={instantSummary} disabled={busy}>
          Instant summary
        </button>
        <button type="button" className="secondary" onClick={genNotes} disabled={busy}>
          Full AI notes
        </button>
        <button type="button" className="ghost" onClick={exportMarkdown}>
          Share (copy MD)
        </button>
      </div>
      )}

      {isLive && (
      <div className="row">
        <label className="inline">
          Glance at another note while recording
          <select
            value={peekTranscriptId ?? ""}
            onChange={(e) => onPeek(e.target.value || null)}
          >
            <option value="">None</option>
            {allTranscripts
              .filter((t) => t.id !== transcript.id)
              .map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
          </select>
        </label>
      </div>
      )}

      {transcript.audio_path && !isLive && (
        <p className="muted mono">Audio: {transcript.audio_path}</p>
      )}
      {message && <p className="status">{message}</p>}
    </div>
  );
}
