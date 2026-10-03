import type { Transcript } from "../types";

interface Props {
  items: Transcript[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function TranscriptList({ items, selectedId, onSelect, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <p>No recordings yet.</p>
        <p className="muted">Press Record to capture audio and transcript text.</p>
      </div>
    );
  }

  return (
    <ul className="transcript-list">
      {items.map((t) => (
        <li key={t.id} className={t.id === selectedId ? "selected" : ""}>
          <button type="button" className="list-item" onClick={() => onSelect(t.id)}>
            <span className="title">{t.title}</span>
            <span className="meta">{formatWhen(t.created_at)}</span>
          </button>
          <button
            type="button"
            className="icon danger"
            title="Delete"
            onClick={() => onDelete(t.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
