import { useEffect, useState } from "react";
import { generateNotes, updateTranscript } from "../api";
import type { AppSettings, Transcript } from "../types";

interface Props {
  transcript: Transcript | null;
  settings: AppSettings;
  onUpdated: (t: Transcript) => void;
}

export function TranscriptDetail({ transcript, settings, onUpdated }: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!transcript) return;
    setTitle(transcript.title);
    setText(transcript.transcript_text);
    setNotes(transcript.notes_text);
    setMessage(null);
  }, [transcript]);

  if (!transcript) {
    return (
      <div className="detail empty">
        <p>Select a recording or start a new one.</p>
      </div>
    );
  }

  const save = async () => {
    setBusy(true);
    try {
      const t = await updateTranscript({
        id: transcript.id,
        title,
        transcript_text: text,
        notes_text: notes,
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
      setNotes(t.notes_text);
      onUpdated(t);
      setMessage("Notes generated via Ollama.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="detail">
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Transcript
        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Live speech-to-text appears here when supported; you can edit or paste text anytime."
        />
      </label>
      <label>
        Meeting notes
        <textarea
          rows={10}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Generate summaries from your transcript using your local Ollama model."
        />
      </label>
      <div className="row">
        <button type="button" onClick={save} disabled={busy}>Save</button>
        <button type="button" className="secondary" onClick={genNotes} disabled={busy}>
          Generate notes (Ollama)
        </button>
      </div>
      {transcript.audio_path && (
        <p className="muted mono">Audio: {transcript.audio_path}</p>
      )}
      {message && <p className="status">{message}</p>}
    </div>
  );
}
