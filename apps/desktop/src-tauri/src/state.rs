use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct AppState {
    pub db: Database,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub starts_at: String,
    pub duration_minutes: i64,
    pub attendees: String,
    #[serde(default)]
    pub meeting_url: Option<String>,
    #[serde(default)]
    pub conference_type: Option<String>,
    #[serde(default)]
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub ollama_base_url: String,
    pub default_model: String,
    pub onboarding_complete: bool,
    pub auto_enhance_on_stop: bool,
    pub auto_instant_summary: bool,
    pub delete_audio_after_transcribe: bool,
    pub floating_pane_visible: bool,
    pub meeting_reminder_minutes: i64,
    pub default_template_id: String,
    pub calendar_events_json: String,
    pub dictation_enabled: bool,
    /// Ollama model for speech-to-text (e.g. gemma4:e4b). Empty uses DEFAULT_TRANSCRIPTION_MODEL.
    pub transcription_model: String,
    pub auto_transcribe_on_stop: bool,
    /// OAuth 2.0 client ID for Google Calendar (desktop app).
    pub google_oauth_client_id: String,
    pub meeting_popup_enabled: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ollama_base_url: crate::ollama::DEFAULT_OLLAMA_URL.to_string(),
            default_model: "llama3.2".to_string(),
            onboarding_complete: false,
            auto_enhance_on_stop: true,
            auto_instant_summary: true,
            delete_audio_after_transcribe: false,
            floating_pane_visible: true,
            meeting_reminder_minutes: 1,
            default_template_id: "general".to_string(),
            calendar_events_json: "[]".to_string(),
            dictation_enabled: false,
            transcription_model: crate::ollama::DEFAULT_TRANSCRIPTION_MODEL.to_string(),
            auto_transcribe_on_stop: true,
            google_oauth_client_id: String::new(),
            meeting_popup_enabled: true,
        }
    }
}

impl AppSettings {
    pub const OLLAMA_URL_KEY: &'static str = "ollama_base_url";
    pub const DEFAULT_MODEL_KEY: &'static str = "default_model";
    pub const ONBOARDING_KEY: &'static str = "onboarding_complete";
    pub const AUTO_ENHANCE_KEY: &'static str = "auto_enhance_on_stop";
    pub const AUTO_INSTANT_KEY: &'static str = "auto_instant_summary";
    pub const DELETE_AUDIO_KEY: &'static str = "delete_audio_after_transcribe";
    pub const FLOATING_PANE_KEY: &'static str = "floating_pane_visible";
    pub const REMINDER_MIN_KEY: &'static str = "meeting_reminder_minutes";
    pub const DEFAULT_TEMPLATE_KEY: &'static str = "default_template_id";
    pub const CALENDAR_JSON_KEY: &'static str = "calendar_events_json";
    pub const DICTATION_KEY: &'static str = "dictation_enabled";
    pub const TRANSCRIPTION_MODEL_KEY: &'static str = "transcription_model";
    pub const AUTO_TRANSCRIBE_KEY: &'static str = "auto_transcribe_on_stop";
    pub const GOOGLE_CLIENT_ID_KEY: &'static str = "google_oauth_client_id";
    pub const MEETING_POPUP_KEY: &'static str = "meeting_popup_enabled";

    pub fn load(db: &Database) -> Self {
        let mut s = AppSettings::default();
        if let Ok(Some(v)) = db.get_setting(Self::OLLAMA_URL_KEY) {
            if !v.is_empty() {
                s.ollama_base_url = v;
            }
        }
        if let Ok(Some(v)) = db.get_setting(Self::DEFAULT_MODEL_KEY) {
            s.default_model = v;
        }
        if let Ok(Some(v)) = db.get_setting(Self::ONBOARDING_KEY) {
            s.onboarding_complete = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::AUTO_ENHANCE_KEY) {
            s.auto_enhance_on_stop = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::AUTO_INSTANT_KEY) {
            s.auto_instant_summary = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::DELETE_AUDIO_KEY) {
            s.delete_audio_after_transcribe = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::FLOATING_PANE_KEY) {
            s.floating_pane_visible = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::REMINDER_MIN_KEY) {
            if let Ok(n) = v.parse() {
                s.meeting_reminder_minutes = n;
            }
        }
        if let Ok(Some(v)) = db.get_setting(Self::DEFAULT_TEMPLATE_KEY) {
            if !v.is_empty() {
                s.default_template_id = v;
            }
        }
        if let Ok(Some(v)) = db.get_setting(Self::CALENDAR_JSON_KEY) {
            if !v.is_empty() {
                s.calendar_events_json = v;
            }
        }
        if let Ok(Some(v)) = db.get_setting(Self::DICTATION_KEY) {
            s.dictation_enabled = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::TRANSCRIPTION_MODEL_KEY) {
            if !v.is_empty() {
                s.transcription_model = v;
            }
        }
        if let Ok(Some(v)) = db.get_setting(Self::AUTO_TRANSCRIBE_KEY) {
            s.auto_transcribe_on_stop = v == "true";
        }
        if let Ok(Some(v)) = db.get_setting(Self::GOOGLE_CLIENT_ID_KEY) {
            s.google_oauth_client_id = v;
        }
        if let Ok(Some(v)) = db.get_setting(Self::MEETING_POPUP_KEY) {
            s.meeting_popup_enabled = v != "false";
        }
        s
    }

    pub fn save(&self, db: &Database) -> Result<(), crate::db::DbError> {
        db.set_setting(Self::OLLAMA_URL_KEY, &self.ollama_base_url)?;
        db.set_setting(Self::DEFAULT_MODEL_KEY, &self.default_model)?;
        db.set_setting(
            Self::ONBOARDING_KEY,
            if self.onboarding_complete {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(
            Self::AUTO_ENHANCE_KEY,
            if self.auto_enhance_on_stop {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(
            Self::AUTO_INSTANT_KEY,
            if self.auto_instant_summary {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(
            Self::DELETE_AUDIO_KEY,
            if self.delete_audio_after_transcribe {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(
            Self::FLOATING_PANE_KEY,
            if self.floating_pane_visible {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(Self::REMINDER_MIN_KEY, &self.meeting_reminder_minutes.to_string())?;
        db.set_setting(Self::DEFAULT_TEMPLATE_KEY, &self.default_template_id)?;
        db.set_setting(Self::CALENDAR_JSON_KEY, &self.calendar_events_json)?;
        db.set_setting(
            Self::DICTATION_KEY,
            if self.dictation_enabled {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(Self::TRANSCRIPTION_MODEL_KEY, &self.transcription_model)?;
        db.set_setting(
            Self::AUTO_TRANSCRIBE_KEY,
            if self.auto_transcribe_on_stop {
                "true"
            } else {
                "false"
            },
        )?;
        db.set_setting(Self::GOOGLE_CLIENT_ID_KEY, &self.google_oauth_client_id)?;
        db.set_setting(
            Self::MEETING_POPUP_KEY,
            if self.meeting_popup_enabled {
                "true"
            } else {
                "false"
            },
        )?;
        Ok(())
    }
}

const APP_DATA_DIR_NAME: &str = "NoteStack";
const LEGACY_APP_DATA_DIR_NAME: &str = "Record Plus";
const BOOTSTRAP_FILE: &str = "bootstrap.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct BootstrapConfig {
    data_directory: Option<String>,
}

/// Application support folder (holds bootstrap.json; default data lives here too).
pub fn bootstrap_dir() -> PathBuf {
    if let Some(parent) = dirs_data_local() {
        let new_dir = parent.join(APP_DATA_DIR_NAME);
        let legacy_dir = parent.join(LEGACY_APP_DATA_DIR_NAME);
        if !new_dir.exists() && legacy_dir.is_dir() {
            let _ = fs::rename(&legacy_dir, &new_dir);
        }
        return new_dir;
    }
    std::env::temp_dir().join("notestack")
}

pub fn read_bootstrap_config() -> BootstrapConfig {
    let path = bootstrap_dir().join(BOOTSTRAP_FILE);
    if !path.is_file() {
        return BootstrapConfig::default();
    }
    match fs::read_to_string(&path) {
        Ok(raw) => serde_json::from_str(&raw).unwrap_or_default(),
        Err(_) => BootstrapConfig::default(),
    }
}

pub fn write_data_dir_override(path: &Path) -> Result<(), String> {
    let dir = bootstrap_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let config = BootstrapConfig {
        data_directory: Some(path.to_string_lossy().to_string()),
    };
    let body = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(dir.join(BOOTSTRAP_FILE), body).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn resolve_data_dir() -> PathBuf {
    let config = read_bootstrap_config();
    if let Some(ref custom) = config.data_directory {
        let trimmed = custom.trim();
        if !trimmed.is_empty() {
            return PathBuf::from(trimmed);
        }
    }
    bootstrap_dir()
}

pub fn app_data_dir() -> PathBuf {
    resolve_data_dir()
}

fn dirs_data_local() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            return Some(PathBuf::from(home).join("Library/Application Support"));
        }
    }
    #[cfg(target_os = "linux")]
    {
        if let Ok(xdg) = std::env::var("XDG_DATA_HOME") {
            return Some(PathBuf::from(xdg));
        }
        if let Ok(home) = std::env::var("HOME") {
            return Some(PathBuf::from(home).join(".local/share"));
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(app) = std::env::var("APPDATA") {
            return Some(PathBuf::from(app));
        }
    }
    None
}

pub type SharedState = Mutex<AppState>;
