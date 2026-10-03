import { useEffect, useRef } from "react";
import { parseCalendarEvents } from "../lib/settings";
import type { AppSettings } from "../types";

export function useMeetingReminders(
  settings: AppSettings,
  onReminder: (title: string) => void,
) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = window.setInterval(() => {
      const events = parseCalendarEvents(settings.calendar_events_json);
      const leadMs = settings.meeting_reminder_minutes * 60_000;
      const now = Date.now();
      for (const e of events) {
        const start = new Date(e.starts_at).getTime();
        const delta = start - now;
        if (delta > 0 && delta <= leadMs && !firedRef.current.has(e.id)) {
          firedRef.current.add(e.id);
          onReminder(e.title);
        }
      }
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [settings, onReminder]);
}
