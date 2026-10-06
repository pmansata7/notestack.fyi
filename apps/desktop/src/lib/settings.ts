import {
  DEFAULT_SPEECH_MODEL,
  LEGACY_SPEECH_MODEL,
} from "./modelRecommendations";
import type { AppSettings, CalendarEvent } from "../types";

export function normalizeSettings(raw: AppSettings): AppSettings {
  return {
    ollama_base_url: raw.ollama_base_url || "http://localhost:11434",
    default_model: raw.default_model || "llama3.2",
    onboarding_complete: raw.onboarding_complete ?? false,
    auto_enhance_on_stop: raw.auto_enhance_on_stop ?? true,
    auto_instant_summary: raw.auto_instant_summary ?? true,
    delete_audio_after_transcribe: raw.delete_audio_after_transcribe ?? false,
    floating_pane_visible: raw.floating_pane_visible ?? true,
    meeting_reminder_minutes: raw.meeting_reminder_minutes ?? 1,
    default_template_id: raw.default_template_id || "general",
    calendar_events_json: raw.calendar_events_json || "[]",
    dictation_enabled: raw.dictation_enabled ?? false,
    transcription_model:
      !raw.transcription_model ||
      raw.transcription_model === LEGACY_SPEECH_MODEL
        ? DEFAULT_SPEECH_MODEL
        : raw.transcription_model,
    auto_transcribe_on_stop: raw.auto_transcribe_on_stop ?? true,
  };
}

export function parseCalendarEvents(json: string): CalendarEvent[] {
  try {
    const parsed = JSON.parse(json) as CalendarEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeCalendarEvents(events: CalendarEvent[]): string {
  return JSON.stringify(events);
}
