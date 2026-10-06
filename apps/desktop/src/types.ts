export interface Transcript {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  transcript_text: string;
  notes_text: string;
  manual_notes: string;
  ai_additions: string;
  instant_summary: string;
  tasks_json: string;
  template_id: string;
  audio_path: string | null;
  duration_ms: number | null;
  deleted_at: string | null;
}

export interface MeetingTask {
  title: string;
  assignee: string | null;
  done: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  attendees: string;
}

export interface AppSettings {
  ollama_base_url: string;
  default_model: string;
  onboarding_complete: boolean;
  auto_enhance_on_stop: boolean;
  auto_instant_summary: boolean;
  delete_audio_after_transcribe: boolean;
  floating_pane_visible: boolean;
  meeting_reminder_minutes: number;
  default_template_id: string;
  calendar_events_json: string;
  dictation_enabled: boolean;
  transcription_model: string;
  auto_transcribe_on_stop: boolean;
}

export interface OllamaModel {
  name: string;
  modified_at?: string | null;
  size?: number | null;
}

export interface OllamaStatus {
  connected: boolean;
  message: string;
}

export interface HardwareHints {
  available_disk_bytes: number;
  total_memory_bytes: number;
  available_memory_bytes: number;
}

export interface OllamaInstallStatus {
  installed: boolean;
  message: string;
}

export const MEETING_TEMPLATES: { id: string; label: string }[] = [
  { id: "general", label: "General meeting" },
  { id: "one_on_one", label: "1:1" },
  { id: "customer_call", label: "Customer call" },
  { id: "sales_call", label: "Sales call" },
  { id: "standup", label: "Standup" },
  { id: "investor_pitch", label: "Investor pitch" },
  { id: "user_research", label: "User research" },
  { id: "interview", label: "Interview" },
];

export const LIVE_SKILLS: { id: string; label: string }[] = [
  { id: "catch-up", label: "Catch up" },
  { id: "summarize", label: "Summarize" },
  { id: "action-items", label: "Action items" },
  { id: "follow-up-questions", label: "Follow-up questions" },
];
