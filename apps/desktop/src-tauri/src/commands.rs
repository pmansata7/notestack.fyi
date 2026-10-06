use crate::db::{now_iso, Transcript};
use crate::ollama::OllamaClient;
use crate::state::{AppSettings, AppState};
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<String> for CommandError {
    fn from(message: String) -> Self {
        Self { message }
    }
}

fn command_err(message: &str) -> CommandError {
    CommandError {
        message: message.to_string(),
    }
}

fn map_err(e: impl std::fmt::Display) -> CommandError {
    CommandError {
        message: e.to_string(),
    }
}

#[tauri::command]
pub fn get_settings(state: State<Mutex<AppState>>) -> Result<AppSettings, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    Ok(AppSettings::load(&state.db))
}

#[tauri::command]
pub fn save_settings(
    settings: AppSettings,
    state: State<Mutex<AppState>>,
) -> Result<(), CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    settings.save(&state.db).map_err(map_err)?;
    Ok(())
}

#[tauri::command]
pub fn get_data_dir(state: State<Mutex<AppState>>) -> Result<String, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    Ok(state.db.recordings_dir().parent().unwrap().to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_transcripts(
    include_deleted: Option<bool>,
    state: State<Mutex<AppState>>,
) -> Result<Vec<Transcript>, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    state
        .db
        .list_transcripts(include_deleted.unwrap_or(false))
        .map_err(map_err)
}

#[tauri::command]
pub fn search_transcripts(
    query: String,
    state: State<Mutex<AppState>>,
) -> Result<Vec<Transcript>, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    state.db.search_transcripts(&query).map_err(map_err)
}

#[tauri::command]
pub fn get_transcript(id: String, state: State<Mutex<AppState>>) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    state
        .db
        .get_transcript(&id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))
}

#[derive(Debug, Deserialize)]
pub struct CreateTranscriptArgs {
    pub title: Option<String>,
    pub transcript_text: Option<String>,
}

#[tauri::command]
pub fn create_transcript(
    args: CreateTranscriptArgs,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let now = now_iso();
    let settings = AppSettings::load(&state.db);
    let t = Transcript {
        id: Uuid::new_v4().to_string(),
        title: args
            .title
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| format!("Recording {}", chrono_prefix())),
        created_at: now.clone(),
        updated_at: now,
        transcript_text: args.transcript_text.unwrap_or_default(),
        notes_text: String::new(),
        manual_notes: String::new(),
        ai_additions: String::new(),
        instant_summary: String::new(),
        tasks_json: "[]".to_string(),
        template_id: settings.default_template_id.clone(),
        audio_path: None,
        duration_ms: None,
        deleted_at: None,
    };
    state.db.insert_transcript(&t).map_err(map_err)?;
    Ok(t)
}

fn chrono_prefix() -> String {
    UtcNow::format()
}

struct UtcNow;
impl UtcNow {
    fn format() -> String {
        chrono::Utc::now().format("%Y-%m-%d %H:%M").to_string()
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateTranscriptArgs {
    pub id: String,
    pub title: Option<String>,
    pub transcript_text: Option<String>,
    pub notes_text: Option<String>,
    pub manual_notes: Option<String>,
    pub ai_additions: Option<String>,
    pub instant_summary: Option<String>,
    pub tasks_json: Option<String>,
    pub template_id: Option<String>,
    pub duration_ms: Option<i64>,
}

#[tauri::command]
pub fn update_transcript(
    args: UpdateTranscriptArgs,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let mut t = state
        .db
        .get_transcript(&args.id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))?;
    if let Some(title) = args.title {
        t.title = title;
    }
    if let Some(text) = args.transcript_text {
        t.transcript_text = text;
    }
    if let Some(notes) = args.notes_text {
        t.notes_text = notes;
    }
    if let Some(v) = args.manual_notes {
        t.manual_notes = v;
    }
    if let Some(v) = args.ai_additions {
        t.ai_additions = v;
    }
    if let Some(v) = args.instant_summary {
        t.instant_summary = v;
    }
    if let Some(v) = args.tasks_json {
        t.tasks_json = v;
    }
    if let Some(v) = args.template_id {
        t.template_id = v;
    }
    if let Some(d) = args.duration_ms {
        t.duration_ms = Some(d);
    }
    t.updated_at = now_iso();
    state.db.update_transcript(&t).map_err(map_err)?;
    Ok(t)
}

#[tauri::command]
pub fn delete_transcript(id: String, state: State<Mutex<AppState>>) -> Result<(), CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    state.db.soft_delete_transcript(&id).map_err(map_err)?;
    Ok(())
}

#[tauri::command]
pub fn restore_transcript(id: String, state: State<Mutex<AppState>>) -> Result<(), CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    state.db.restore_transcript(&id).map_err(map_err)?;
    Ok(())
}

#[tauri::command]
pub fn purge_transcript(id: String, state: State<Mutex<AppState>>) -> Result<(), CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    if let Some(t) = state.db.get_transcript(&id).map_err(map_err)? {
        if let Some(path) = t.audio_path {
            let _ = std::fs::remove_file(path);
        }
    }
    state.db.purge_transcript(&id).map_err(map_err)?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct SaveAudioArgs {
    pub transcript_id: String,
    pub audio_base64: String,
    pub extension: Option<String>,
}

#[tauri::command]
pub fn save_recording_audio(
    args: SaveAudioArgs,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let mut t = state
        .db
        .get_transcript(&args.transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))?;

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(args.audio_base64.trim())
        .map_err(|e| CommandError::from(format!("invalid audio data: {}", e)))?;

    let ext = args.extension.filter(|e| !e.is_empty()).unwrap_or_else(|| "webm".into());
    let filename = format!("{}.{}", t.id, ext);
    let path = state.db.recordings_dir().join(&filename);
    std::fs::write(&path, &bytes).map_err(map_err)?;

    t.audio_path = Some(path.to_string_lossy().to_string());
    t.updated_at = now_iso();
    state.db.update_transcript(&t).map_err(map_err)?;
    Ok(t)
}

#[derive(Debug, Serialize)]
pub struct OllamaStatus {
    pub connected: bool,
    pub message: String,
}

#[tauri::command]
pub fn ollama_check_connection(base_url: Option<String>) -> Result<OllamaStatus, CommandError> {
    let client = OllamaClient::new(base_url);
    match client.check_connection() {
        Ok(()) => Ok(OllamaStatus {
            connected: true,
            message: "Connected to Ollama".into(),
        }),
        Err(e) => Ok(OllamaStatus {
            connected: false,
            message: e.to_string(),
        }),
    }
}

#[tauri::command]
pub fn ollama_list_models(base_url: Option<String>) -> Result<Vec<crate::ollama::OllamaModel>, CommandError> {
    let client = OllamaClient::new(base_url);
    client.list_models().map_err(map_err)
}

#[tauri::command]
pub fn ollama_pull_model(
    model: String,
    base_url: Option<String>,
) -> Result<String, CommandError> {
    let client = OllamaClient::new(base_url);
    client.pull_model(&model).map_err(map_err)
}

#[tauri::command]
pub fn ollama_test_model(
    model: String,
    base_url: Option<String>,
) -> Result<String, CommandError> {
    let client = OllamaClient::new(base_url);
    client.test_model(&model).map_err(map_err)
}

#[tauri::command]
pub fn generate_notes_from_transcript(
    transcript_id: String,
    model: Option<String>,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let settings = AppSettings::load(&state.db);
    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model);

    let mut t = state
        .db
        .get_transcript(&transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))?;

    if t.transcript_text.trim().is_empty() {
        return Err(command_err("Add transcript text before generating notes"));
    }

    let client = OllamaClient::new(Some(settings.ollama_base_url));
    let notes = client
        .generate_notes(&model, &t.transcript_text)
        .map_err(map_err)?;
    t.notes_text = notes;
    t.updated_at = now_iso();
    state.db.update_transcript(&t).map_err(map_err)?;
    Ok(t)
}

fn meeting_context_block(transcripts: &[Transcript]) -> String {
    transcripts
        .iter()
        .take(12)
        .map(|t| {
            format!(
                "### {} ({})\nSummary: {}\nNotes: {}\nTranscript excerpt: {}\n",
                t.title,
                t.created_at,
                t.instant_summary,
                t.notes_text,
                t.transcript_text.chars().take(1200).collect::<String>()
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

#[tauri::command]
pub fn enhance_notes_for_transcript(
    transcript_id: String,
    model: Option<String>,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let settings = AppSettings::load(&state.db);
    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model.clone());

    let mut t = state
        .db
        .get_transcript(&transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))?;

    if t.transcript_text.trim().is_empty() && t.manual_notes.trim().is_empty() {
        return Err(command_err("Add a transcript or manual notes before enhancing"));
    }

    let template_label = t.template_id.replace('_', " ");
    let client = OllamaClient::new(Some(settings.ollama_base_url));
    let ai = client
        .enhance_notes(&model, &t.transcript_text, &t.manual_notes, &template_label)
        .map_err(map_err)?;
    t.ai_additions = ai;
    t.notes_text = format!(
        "{}\n\n---\n\n**AI enhancements**\n\n{}",
        t.manual_notes.trim(),
        t.ai_additions.trim()
    );
    let tasks = client
        .extract_tasks_json(&model, &t.notes_text)
        .map_err(map_err)?;
    t.tasks_json = tasks;
    t.updated_at = now_iso();
    state.db.update_transcript(&t).map_err(map_err)?;
    Ok(t)
}

#[tauri::command]
pub fn generate_instant_summary(
    transcript_id: String,
    model: Option<String>,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let settings = AppSettings::load(&state.db);
    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model.clone());

    let mut t = state
        .db
        .get_transcript(&transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))?;

    if t.transcript_text.trim().is_empty() {
        return Err(command_err("Add transcript text first"));
    }

    let client = OllamaClient::new(Some(settings.ollama_base_url));
    t.instant_summary = client
        .instant_summary(&model, &t.transcript_text)
        .map_err(map_err)?;
    t.updated_at = now_iso();
    state.db.update_transcript(&t).map_err(map_err)?;
    Ok(t)
}

#[derive(Debug, Deserialize)]
pub struct AskMeetingsArgs {
    pub question: String,
    pub model: Option<String>,
}

#[tauri::command]
pub fn ask_across_meetings(
    args: AskMeetingsArgs,
    state: State<Mutex<AppState>>,
) -> Result<String, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let settings = AppSettings::load(&state.db);
    let model = args
        .model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model.clone());
    let list = state.db.list_transcripts(false).map_err(map_err)?;
    let context = meeting_context_block(&list);
    let client = OllamaClient::new(Some(settings.ollama_base_url));
    client
        .ask_across_meetings(&model, &args.question, &context)
        .map_err(map_err)
}

#[tauri::command]
pub fn generate_daily_digest(
    model: Option<String>,
    state: State<Mutex<AppState>>,
) -> Result<String, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let settings = AppSettings::load(&state.db);
    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model.clone());
    let list = state.db.list_transcripts(false).map_err(map_err)?;
    let recent: Vec<_> = list.into_iter().take(20).collect();
    let context = meeting_context_block(&recent);
    let client = OllamaClient::new(Some(settings.ollama_base_url));
    client.daily_digest(&model, &context).map_err(map_err)
}

#[derive(Debug, Deserialize)]
pub struct MeetingPrepArgs {
    pub event_title: String,
    pub model: Option<String>,
}

#[tauri::command]
pub fn generate_meeting_prep(
    args: MeetingPrepArgs,
    state: State<Mutex<AppState>>,
) -> Result<String, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let settings = AppSettings::load(&state.db);
    let model = args
        .model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model.clone());
    let list = state.db.list_transcripts(false).map_err(map_err)?;
    let context = meeting_context_block(&list);
    let client = OllamaClient::new(Some(settings.ollama_base_url));
    client
        .meeting_prep(&model, &args.event_title, &context)
        .map_err(map_err)
}

#[derive(Debug, Deserialize)]
pub struct LiveSkillArgs {
    pub skill: String,
    pub transcript_so_far: String,
    pub model: Option<String>,
}

#[tauri::command]
pub fn run_live_skill(args: LiveSkillArgs) -> Result<String, CommandError> {
    let model = args
        .model
        .filter(|m| !m.is_empty())
        .unwrap_or_else(|| "llama3.2".to_string());
    let client = OllamaClient::new(None);
    client
        .live_skill(&model, &args.skill, &args.transcript_so_far)
        .map_err(map_err)
}

#[tauri::command]
pub fn transcribe_recording_audio(
    transcript_id: String,
    model: Option<String>,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    let settings = AppSettings::load(&state.db);
    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or_else(|| {
            if settings.transcription_model.trim().is_empty() {
                "whisper".to_string()
            } else {
                settings.transcription_model.clone()
            }
        });

    let mut t = state
        .db
        .get_transcript(&transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| CommandError::from("transcript not found".into()))?;

    let path = t
        .audio_path
        .as_ref()
        .ok_or_else(|| CommandError::from("no audio saved for this recording".into()))?;

    let client = OllamaClient::new(Some(settings.ollama_base_url));
    let text = client
        .transcribe_audio_file(&model, std::path::Path::new(path))
        .map_err(map_err)?;

    if !text.trim().is_empty() {
        if t.transcript_text.trim().is_empty() {
            t.transcript_text = text;
        } else {
            t.transcript_text = format!("{}\n{}", t.transcript_text.trim(), text.trim());
        }
    }
    t.updated_at = now_iso();
    state.db.update_transcript(&t).map_err(map_err)?;
    Ok(t)
}

#[tauri::command]
pub fn strip_audio_after_transcribe(
    transcript_id: String,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| command_err("state lock failed"))?;
    let mut t = state
        .db
        .get_transcript(&transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| command_err("transcript not found"))?;
    if let Some(path) = t.audio_path.clone() {
        let _ = std::fs::remove_file(path);
        t.audio_path = None;
        t.updated_at = now_iso();
        state.db.update_transcript(&t).map_err(map_err)?;
    }
    Ok(t)
}
