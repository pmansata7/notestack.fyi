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
    floating_pane_visible: raw.floating_pane_visible ?? false,
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
    google_oauth_client_id: raw.google_oauth_client_id ?? "",
    meeting_popup_enabled: raw.meeting_popup_enabled ?? true,
    identify_speakers: raw.identify_speakers ?? true,
    slack_webhook_url: raw.slack_webhook_url ?? "",
    slack_auto_post_on_enhance: raw.slack_auto_post_on_enhance ?? false,
    notion_integration_token: raw.notion_integration_token ?? "",
    notion_database_id: raw.notion_database_id ?? "",
    notion_auto_post_on_enhance: raw.notion_auto_post_on_enhance ?? false,
    zapier_webhook_url: raw.zapier_webhook_url ?? "",
    zapier_auto_post_on_enhance: raw.zapier_auto_post_on_enhance ?? false,
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
