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

fn map_err(e: impl std::fmt::Display) -> CommandError {
    CommandError {
        message: e.to_string(),
    }
}

#[tauri::command]
pub fn get_settings(state: State<Mutex<AppState>>) -> Result<AppSettings, CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    Ok(AppSettings::load(&state.db))
}

#[tauri::command]
pub fn save_settings(
    settings: AppSettings,
    state: State<Mutex<AppState>>,
) -> Result<(), CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    settings.save(&state.db).map_err(map_err)?;
    Ok(())
}

#[tauri::command]
pub fn get_data_dir(state: State<Mutex<AppState>>) -> Result<String, CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    Ok(state.db.recordings_dir().parent().unwrap().to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_transcripts(state: State<Mutex<AppState>>) -> Result<Vec<Transcript>, CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    state.db.list_transcripts().map_err(map_err)
}

#[tauri::command]
pub fn get_transcript(id: String, state: State<Mutex<AppState>>) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    state
        .db
        .get_transcript(&id)
        .map_err(map_err)?
        .ok_or_else(|| CommandError::from("transcript not found".into()))
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
    let state = state.lock().map_err(|_| "state lock failed")?;
    let now = now_iso();
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
        audio_path: None,
        duration_ms: None,
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
    pub duration_ms: Option<i64>,
}

#[tauri::command]
pub fn update_transcript(
    args: UpdateTranscriptArgs,
    state: State<Mutex<AppState>>,
) -> Result<Transcript, CommandError> {
    let state = state.lock().map_err(|_| "state lock failed")?;
    let mut t = state
        .db
        .get_transcript(&args.id)
        .map_err(map_err)?
        .ok_or_else(|| CommandError::from("transcript not found".into()))?;
    if let Some(title) = args.title {
        t.title = title;
    }
    if let Some(text) = args.transcript_text {
        t.transcript_text = text;
    }
    if let Some(notes) = args.notes_text {
        t.notes_text = notes;
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
    let state = state.lock().map_err(|_| "state lock failed")?;
    if let Some(t) = state.db.get_transcript(&id).map_err(map_err)? {
        if let Some(path) = t.audio_path {
            let _ = std::fs::remove_file(path);
        }
    }
    state.db.delete_transcript(&id).map_err(map_err)?;
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
    let state = state.lock().map_err(|_| "state lock failed")?;
    let mut t = state
        .db
        .get_transcript(&args.transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| CommandError::from("transcript not found".into()))?;

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
    let state = state.lock().map_err(|_| "state lock failed")?;
    let settings = AppSettings::load(&state.db);
    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or(settings.default_model);

    let mut t = state
        .db
        .get_transcript(&transcript_id)
        .map_err(map_err)?
        .ok_or_else(|| CommandError::from("transcript not found".into()))?;

    if t.transcript_text.trim().is_empty() {
        return Err(CommandError::from(
            "Add transcript text before generating notes".into(),
        ));
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
