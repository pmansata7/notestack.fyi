import { useState } from "react";
import { askAcrossMeetings } from "../api";
import type { AppSettings } from "../types";

interface Props {
  settings: AppSettings;
}

export function AskMeetingsPanel({ settings }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setBusy(true);
    try {
      setAnswer(
        await askAcrossMeetings(question.trim(), settings.default_model),
      );
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel ask-panel">
      <h2>Ask across meetings</h2>
      <p className="muted">
        Chat over your local history (Granola / Fireflies-style). Answers use Ollama
        on your machine.
      </p>
      <label>
        Question
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What did we decide about pricing last week?"
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask();
          }}
        />
      </label>
      <div className="row">
        <button type="button" onClick={() => void ask()} disabled={busy}>
          Ask
        </button>
      </div>
      {answer && <pre className="ask-answer">{answer}</pre>}
    </div>
  );
}
