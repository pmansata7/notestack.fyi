import { useMemo, useState } from "react";
import {
  generateDailyDigest,
  generateMeetingPrep,
} from "../api";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { conferenceLabel } from "../lib/conference";
import { parseCalendarEvents } from "../lib/settings";
import type { AppSettings, Transcript } from "../types";

interface Props {
  settings: AppSettings;
  transcripts: Transcript[];
  onSaveSettings: (s: AppSettings) => void;
  onStartRecordingForEvent: (title: string) => void;
}

export function AssistantHub({
  settings,
  transcripts,
  onSaveSettings,
  onStartRecordingForEvent,
}: Props) {
  const [digest, setDigest] = useState<string | null>(null);
  const [prep, setPrep] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventWhen, setNewEventWhen] = useState("");

  const calendar = useGoogleCalendar(settings, onSaveSettings);

  const events = useMemo(
    () => parseCalendarEvents(settings.calendar_events_json),
    [settings.calendar_events_json],
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.starts_at).getTime() >= now - 60_000)
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )
      .slice(0, 6);
  }, [events]);

  const addEvent = () => {
    if (!newEventTitle.trim() || !newEventWhen) return;
    const next = [
      ...events,
      {
        id: crypto.randomUUID(),
        title: newEventTitle.trim(),
        starts_at: new Date(newEventWhen).toISOString(),
        duration_minutes: 30,
        attendees: "",
        source: "local",
      },
    ];
    onSaveSettings({
      ...settings,
      calendar_events_json: JSON.stringify(next),
    });
    setNewEventTitle("");
    setNewEventWhen("");
  };

  const runDigest = async () => {
    setBusy(true);
    try {
      setDigest(await generateDailyDigest(settings.default_model));
    } catch (e) {
      setDigest(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const runPrep = async (title: string) => {
    setBusy(true);
    try {
      setPrep(await generateMeetingPrep(title, settings.default_model));
    } catch (e) {
      setPrep(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const recentTitles = transcripts.slice(0, 3).map((t) => t.title);

  return (
    <div className="assistant-hub">
      <section className="hub-card">
        <h3>Upcoming & calendar</h3>
        <p className="muted small">
          Connect Google Calendar to sync meetings and get Granola-style prompts
          for Zoom, Teams, and Meet.
        </p>
        <div className="row tight calendar-connect-row">
          {calendar.status?.connected ? (
            <>
              <span className="muted small">
                {calendar.status.email ?? "Google Calendar"} ·{" "}
                {calendar.status.last_sync_at
                  ? `Synced ${new Date(calendar.status.last_sync_at).toLocaleString()}`
                  : "Not synced yet"}
              </span>
              <button
                type="button"
                className="secondary small"
                disabled={calendar.busy}
                onClick={() => void calendar.syncNow()}
              >
                Sync
              </button>
              <button
                type="button"
                className="ghost small"
                disabled={calendar.busy}
                onClick={() => void calendar.disconnect()}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              className="secondary small"
              disabled={calendar.busy || !calendar.status?.client_id_configured}
              onClick={() => void calendar.connect()}
            >
              Connect Google Calendar
            </button>
          )}
        </div>
        {!calendar.status?.client_id_configured && (
          <p className="muted small">
            Add your Google OAuth client ID in Settings first (desktop app type).
          </p>
        )}
        {calendar.error && <p className="error small">{calendar.error}</p>}
        <ul className="event-list">
          {upcoming.length === 0 && (
            <li className="muted">No upcoming events — add one below.</li>
          )}
          {upcoming.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.title}</strong>
                <span className="meta">
                  {new Date(e.starts_at).toLocaleString()} · {e.duration_minutes}m
                  {e.conference_type
                    ? ` · ${conferenceLabel(e.conference_type)}`
                    : ""}
                </span>
              </div>
              <div className="row tight">
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => void runPrep(e.title)}
                  disabled={busy}
                >
                  Brief
                </button>
                <button
                  type="button"
                  className="small"
                  onClick={() => onStartRecordingForEvent(e.title)}
                >
                  Take notes
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="row">
          <input
            placeholder="Meeting title"
            value={newEventTitle}
            onChange={(ev) => setNewEventTitle(ev.target.value)}
          />
          <input
            type="datetime-local"
            value={newEventWhen}
            onChange={(ev) => setNewEventWhen(ev.target.value)}
          />
          <button type="button" className="secondary" onClick={addEvent}>
            Add
          </button>
        </div>
      </section>

      <section className="hub-card">
        <h3>Daily digest</h3>
        <p className="muted small">
          Fireflies-style recap of the last day — powered by your local notes.
        </p>
        <button type="button" onClick={() => void runDigest()} disabled={busy}>
          Generate digest
        </button>
        {digest && <pre className="digest-output">{digest}</pre>}
      </section>

      <section className="hub-card">
        <h3>Meeting prep</h3>
        <p className="muted small">
          Granola-style brief from past notes. Recent:{" "}
          {recentTitles.join(", ") || "none yet"}.
        </p>
        {prep && <pre className="digest-output">{prep}</pre>}
      </section>
    </div>
  );
}
