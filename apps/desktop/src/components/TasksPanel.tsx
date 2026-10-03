import { useMemo } from "react";
import type { MeetingTask, Transcript } from "../types";

interface Props {
  transcripts: Transcript[];
}

function parseTasks(json: string): MeetingTask[] {
  try {
    const raw = JSON.parse(json) as MeetingTask[];
    if (!Array.isArray(raw)) return [];
    return raw.filter((t) => t && typeof t.title === "string");
  } catch {
    return [];
  }
}

export function TasksPanel({ transcripts }: Props) {
  const tasks = useMemo(() => {
    const out: { task: MeetingTask; meeting: string; id: string }[] = [];
    for (const t of transcripts) {
      for (const task of parseTasks(t.tasks_json)) {
        out.push({ task, meeting: t.title, id: t.id });
      }
    }
    return out;
  }, [transcripts]);

  return (
    <div className="panel tasks-panel">
      <h2>Tasks</h2>
      <p className="muted">
        Action items extracted when you enhance notes (always on, Fireflies-style).
      </p>
      {tasks.length === 0 ? (
        <p className="muted">No tasks yet — enhance notes after a meeting.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((row, i) => (
            <li key={`${row.id}-${i}`}>
              <input type="checkbox" checked={row.task.done} readOnly />
              <div>
                <strong>{row.task.title}</strong>
                <span className="meta">
                  {row.meeting}
                  {row.task.assignee ? ` · ${row.task.assignee}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
