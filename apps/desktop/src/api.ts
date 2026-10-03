import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, OllamaModel, OllamaStatus, Transcript } from "./types";

export async function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function getDataDir(): Promise<string> {
  return invoke("get_data_dir");
}

export async function listTranscripts(): Promise<Transcript[]> {
  return invoke("list_transcripts");
}

export async function createTranscript(
  title?: string,
  transcriptText?: string,
): Promise<Transcript> {
  return invoke("create_transcript", {
    args: { title, transcript_text: transcriptText },
  });
}

export async function updateTranscript(args: {
  id: string;
  title?: string;
  transcript_text?: string;
  notes_text?: string;
  duration_ms?: number;
}): Promise<Transcript> {
  return invoke("update_transcript", { args });
}

export async function deleteTranscript(id: string): Promise<void> {
  return invoke("delete_transcript", { id });
}

export async function saveRecordingAudio(
  transcriptId: string,
  audioBase64: string,
  extension?: string,
): Promise<Transcript> {
  return invoke("save_recording_audio", {
    args: {
      transcript_id: transcriptId,
      audio_base64: audioBase64,
      extension,
    },
  });
}

export async function ollamaCheckConnection(
  baseUrl?: string,
): Promise<OllamaStatus> {
  return invoke("ollama_check_connection", { base_url: baseUrl });
}

export async function ollamaListModels(
  baseUrl?: string,
): Promise<OllamaModel[]> {
  return invoke("ollama_list_models", { base_url: baseUrl });
}

export async function ollamaPullModel(
  model: string,
  baseUrl?: string,
): Promise<string> {
  return invoke("ollama_pull_model", { model, base_url: baseUrl });
}

export async function ollamaTestModel(
  model: string,
  baseUrl?: string,
): Promise<string> {
  return invoke("ollama_test_model", { model, base_url: baseUrl });
}

export async function generateNotes(
  transcriptId: string,
  model?: string,
): Promise<Transcript> {
  return invoke("generate_notes_from_transcript", {
    transcript_id: transcriptId,
    model,
  });
}
