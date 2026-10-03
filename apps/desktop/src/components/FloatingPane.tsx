import { useState } from "react";
import { runLiveSkill } from "../api";
import { LIVE_SKILLS } from "../types";
import type { AppSettings } from "../types";

interface Props {
  visible: boolean;
  elapsedMs: number;
  liveTranscript: string;
  manualNotes: string;
  onManualNotesChange: (v: string) => void;
  onLiveTranscriptChange: (v: string) => void;
  settings: AppSettings;
  onClose: () => void;
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function FloatingPane({
  visible,
  elapsedMs,
  liveTranscript,
  manualNotes,
  onManualNotesChange,
  onLiveTranscriptChange,
  settings,
  onClose,
}: Props) {
  const [ask, setAsk] = useState("");
  const [askReply, setAskReply] = useState<string | null>(null);
  const [skillBusy, setSkillBusy] = useState(false);
  const [tab, setTab] = useState<"live" | "notes" | "ask">("live");

  if (!visible) return null;

  const runSkill = async (skill: string) => {
    setSkillBusy(true);
    setAskReply(null);
    try {
      const text = await runLiveSkill(
        skill,
        liveTranscript,
        settings.default_model,
      );
      setAskReply(text);
      setTab("ask");
    } catch (e) {
      setAskReply(e instanceof Error ? e.message : String(e));
    } finally {
      setSkillBusy(false);
    }
  };

  const submitAsk = async () => {
    if (!ask.trim()) return;
    setSkillBusy(true);
    try {
      const text = await runLiveSkill(
        ask.trim(),
        liveTranscript,
        settings.default_model,
      );
      setAskReply(text);
    } catch (e) {
      setAskReply(e instanceof Error ? e.message : String(e));
    } finally {
      setSkillBusy(false);
    }
  };

  return (
    <div className="floating-pane" role="dialog" aria-label="Live assist">
      <header className="floating-header">
        <div>
          <strong>Live Assist</strong>
          <span className="rec-dot" aria-hidden />
          <span className="muted small">{formatElapsed(elapsedMs)}</span>
        </div>
        <button type="button" className="ghost small" onClick={onClose}>
          Hide
        </button>
      </header>
      <p className="consent-banner small">
        Bot-free capture: recording indicator is on. Get consent from participants.
      </p>
      <nav className="floating-tabs">
        {(["live", "notes", "ask"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "active" : "ghost"}
            onClick={() => setTab(t)}
          >
            {t === "live" ? "Transcript" : t === "notes" ? "Manual notes" : "Ask / Skills"}
          </button>
        ))}
      </nav>
      {tab === "live" && (
        <textarea
          rows={8}
          value={liveTranscript}
          onChange={(e) => onLiveTranscriptChange(e.target.value)}
          placeholder="Live transcript…"
        />
      )}
      {tab === "notes" && (
        <textarea
          rows={8}
          className="manual-notes"
          value={manualNotes}
          onChange={(e) => onManualNotesChange(e.target.value)}
          placeholder="Jot bullets while you listen (Granola-style)…"
        />
      )}
      {tab === "ask" && (
        <div className="ask-block">
          <div className="skill-row">
            {LIVE_SKILLS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="secondary small"
                disabled={skillBusy}
                onClick={() => void runSkill(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="small">
            Ask about this meeting (type / for skills)
            <input
              value={ask}
              onChange={(e) => {
                const v = e.target.value;
                setAsk(v);
                if (v.startsWith("/")) {
                  const match = LIVE_SKILLS.find((s) =>
                    v.toLowerCase().includes(s.id),
                  );
                  if (match) void runSkill(match.id);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitAsk();
              }}
            />
          </label>
          <button
            type="button"
            disabled={skillBusy}
            onClick={() => void submitAsk()}
          >
            Ask
          </button>
          {askReply && <pre className="skill-output">{askReply}</pre>}
        </div>
      )}
    </div>
  );
}
