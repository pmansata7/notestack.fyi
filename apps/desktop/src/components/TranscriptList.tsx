import type { Transcript } from "../types";

interface Props {
  items: Transcript[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDuration(ms: number | null) {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function TranscriptList({
  items,
  selectedId,
  onSelect,
  onDelete,
  search,
  onSearchChange,
}: Props) {
  return (
    <>
      <label className="search-box">
        Search meetings
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Titles, transcripts, notes…"
        />
      </label>
      {items.length === 0 ? (
        <div className="empty sidebar-empty">
          <p className="empty-title">No recordings yet</p>
          <p className="muted small">
            Start a session with the button above to capture audio and notes locally.
          </p>
        </div>
      ) : (
        <ul className="transcript-list">
          {items.map((t) => (
            <li key={t.id} className={t.id === selectedId ? "selected" : ""}>
              <button type="button" className="list-item" onClick={() => onSelect(t.id)}>
                <span className="title">{t.title}</span>
                <span className="meta">
                  {formatWhen(t.created_at)}
                  {t.duration_ms ? ` · ${formatDuration(t.duration_ms)}` : ""}
                </span>
              </button>
              <button
                type="button"
                className="icon danger"
                title="Move to trash"
                onClick={() => onDelete(t.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
