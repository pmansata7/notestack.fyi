import { openUrl } from "@tauri-apps/plugin-opener";
import { conferenceLabel } from "../lib/conference";
import type { MeetingAlert } from "../types";

interface Props {
  alert: MeetingAlert;
  onTakeNotes: () => void;
  onDismiss: () => void;
}

function reasonLine(alert: MeetingAlert): string {
  if (alert.reason === "upcoming") {
    return "Starting soon";
  }
  if (alert.reason === "started") {
    return "In your calendar now";
  }
  return "Meeting app detected";
}

export function MeetingPrompt({ alert, onTakeNotes, onDismiss }: Props) {
  const platform = conferenceLabel(alert.conference_type);

  return (
    <div className="meeting-prompt" role="dialog" aria-label="Meeting detected">
      <div className="meeting-prompt-body">
        <p className="meeting-prompt-kicker">{reasonLine(alert)}</p>
        <strong className="meeting-prompt-title">{alert.title}</strong>
        <span className="meeting-prompt-meta">{platform}</span>
      </div>
      <div className="meeting-prompt-actions">
        <button type="button" className="record-btn small-prompt" onClick={onTakeNotes}>
          Take notes
        </button>
        {alert.meeting_url && (
          <button
            type="button"
            className="secondary small-prompt"
            onClick={() => void openUrl(alert.meeting_url!)}
          >
            Join
          </button>
        )}
        <button type="button" className="ghost small-prompt" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
