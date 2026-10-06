import { invoke } from "@tauri-apps/api/core";
import type {
  AppSettings,
  HardwareHints,
  OllamaInstallStatus,
  OllamaModel,
  OllamaStatus,
  Transcript,
} from "./types";

export async function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function getDataDir(): Promise<string> {
  return invoke("get_data_dir");
}

export async function getHardwareHints(): Promise<HardwareHints> {
  return invoke("get_hardware_hints");
}

export async function setStorageDirectory(path: string): Promise<string> {
  return invoke("set_storage_directory", { path });
}

export async function ollamaIsInstalled(): Promise<OllamaInstallStatus> {
  return invoke("ollama_is_installed");
}

export async function ollamaInstall(): Promise<string> {
  return invoke("ollama_install");
}

export async function listTranscripts(
  includeDeleted = false,
): Promise<Transcript[]> {
  return invoke("list_transcripts", { include_deleted: includeDeleted });
}

export async function searchTranscripts(query: string): Promise<Transcript[]> {
  return invoke("search_transcripts", { query });
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
  manual_notes?: string;
  ai_additions?: string;
  instant_summary?: string;
  tasks_json?: string;
  template_id?: string;
  duration_ms?: number;
}): Promise<Transcript> {
  return invoke("update_transcript", { args });
}

export async function deleteTranscript(id: string): Promise<void> {
  return invoke("delete_transcript", { id });
}

export async function restoreTranscript(id: string): Promise<void> {
  return invoke("restore_transcript", { id });
}

export async function purgeTranscript(id: string): Promise<void> {
  return invoke("purge_transcript", { id });
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

export async function stripAudioAfterTranscribe(
  transcriptId: string,
): Promise<Transcript> {
  return invoke("strip_audio_after_transcribe", { transcript_id: transcriptId });
}

export async function transcribeRecordingAudio(
  transcriptId: string,
  model?: string,
): Promise<Transcript> {
  return invoke("transcribe_recording_audio", {
    transcript_id: transcriptId,
    model,
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

export async function enhanceNotes(
  transcriptId: string,
  model?: string,
): Promise<Transcript> {
  return invoke("enhance_notes_for_transcript", {
    transcript_id: transcriptId,
    model,
  });
}

export async function generateInstantSummary(
  transcriptId: string,
  model?: string,
): Promise<Transcript> {
  return invoke("generate_instant_summary", {
    transcript_id: transcriptId,
    model,
  });
}

export async function askAcrossMeetings(
  question: string,
  model?: string,
): Promise<string> {
  return invoke("ask_across_meetings", {
    args: { question, model },
  });
}

export async function generateDailyDigest(model?: string): Promise<string> {
  return invoke("generate_daily_digest", { model });
}

export async function generateMeetingPrep(
  eventTitle: string,
  model?: string,
): Promise<string> {
  return invoke("generate_meeting_prep", {
    args: { event_title: eventTitle, model },
  });
}

export async function runLiveSkill(
  skill: string,
  transcriptSoFar: string,
  model?: string,
): Promise<string> {
  return invoke("run_live_skill", {
    args: {
      skill,
      transcript_so_far: transcriptSoFar,
      model,
    },
  });
}
