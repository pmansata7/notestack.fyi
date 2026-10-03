export interface Transcript {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  transcript_text: string;
  notes_text: string;
  audio_path: string | null;
  duration_ms: number | null;
}

export interface AppSettings {
  ollama_base_url: string;
  default_model: string;
  onboarding_complete: boolean;
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
