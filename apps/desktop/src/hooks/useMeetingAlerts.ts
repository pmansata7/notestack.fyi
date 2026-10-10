import { useEffect, useRef, useState } from "react";
import { detectForegroundMeeting } from "../api";
import { parseCalendarEvents } from "../lib/settings";
import type { AppSettings, MeetingAlert } from "../types";

function eventWindow(
  startsAt: string,
  durationMinutes: number,
): { start: number; end: number } {
  const start = new Date(startsAt).getTime();
  const end = start + durationMinutes * 60_000;
  return { start, end };
}

export function useMeetingAlerts(
  settings: AppSettings,
  options: { recording: boolean },
) {
  const [alert, setAlert] = useState<MeetingAlert | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.meeting_popup_enabled) {
      setAlert(null);
      return;
    }

    const tick = async () => {
      if (options.recording) {
        setAlert(null);
        return;
      }

      const now = Date.now();
      const events = parseCalendarEvents(settings.calendar_events_json);
      const leadMs = settings.meeting_reminder_minutes * 60_000;

      for (const e of events) {
        const { start, end } = eventWindow(e.starts_at, e.duration_minutes);
        const idStarted = `started:${e.id}`;
        if (now >= start && now <= end && !dismissedRef.current.has(idStarted)) {
          setAlert({
            id: idStarted,
            title: e.title,
            reason: "started",
            conference_type: e.conference_type,
            meeting_url: e.meeting_url,
          });
          return;
        }
      }

      for (const e of events) {
        const { start } = eventWindow(e.starts_at, e.duration_minutes);
        const idUpcoming = `upcoming:${e.id}`;
        const delta = start - now;
        if (
          delta > 0 &&
          delta <= leadMs &&
          !dismissedRef.current.has(idUpcoming)
        ) {
          setAlert({
            id: idUpcoming,
            title: e.title,
            reason: "upcoming",
            conference_type: e.conference_type,
            meeting_url: e.meeting_url,
          });
          return;
        }
      }

      const fg = await detectForegroundMeeting();
      if (!fg) {
        setAlert((current) =>
          current?.reason === "detected" ? null : current,
        );
        return;
      }
      const detectId = `detected:${fg.kind}`;
      if (dismissedRef.current.has(detectId)) {
        return;
      }
      setAlert({
        id: detectId,
        title: fg.label,
        reason: "detected",
        conference_type: fg.kind,
      });
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 12_000);
    return () => window.clearInterval(interval);
  }, [settings, options.recording]);

  const dismiss = (id: string) => {
    dismissedRef.current.add(id);
    setAlert((current) => (current?.id === id ? null : current));
  };

  return { alert, dismiss };
}
