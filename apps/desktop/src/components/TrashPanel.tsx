import { useCallback, useEffect, useState } from "react";
import { listTranscripts, purgeTranscript, restoreTranscript } from "../api";
import type { Transcript } from "../types";

interface Props {
  onRestored: () => void;
}

export function TrashPanel({ onRestored }: Props) {
  const [items, setItems] = useState<Transcript[]>([]);

  const load = useCallback(async () => {
    const all = await listTranscripts(true);
    setItems(all.filter((t) => t.deleted_at));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="panel trash-panel">
      <h2>Trash</h2>
      <p className="muted">Restore or permanently delete notes (Granola-style).</p>
      {items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">Trash is empty</p>
          <p className="muted small">Deleted recordings appear here until you restore or remove them.</p>
        </div>
      ) : (
        <ul className="transcript-list trash-list">
          {items.map((t) => (
            <li key={t.id}>
              <div className="list-item static">
                <span className="title">{t.title}</span>
                <span className="meta">Deleted {t.deleted_at}</span>
              </div>
              <button
                type="button"
                className="secondary small"
                onClick={async () => {
                  await restoreTranscript(t.id);
                  await load();
                  onRestored();
                }}
              >
                Restore
              </button>
              <button
                type="button"
                className="icon danger"
                title="Delete forever"
                onClick={async () => {
                  await purgeTranscript(t.id);
                  await load();
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
