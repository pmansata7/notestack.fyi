use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub db: Database,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub ollama_base_url: String,
    pub default_model: String,
    pub onboarding_complete: bool,
}

impl AppSettings {
    pub const OLLAMA_URL_KEY: &'static str = "ollama_base_url";
    pub const DEFAULT_MODEL_KEY: &'static str = "default_model";
    pub const ONBOARDING_KEY: &'static str = "onboarding_complete";

    pub fn load(db: &Database) -> Self {
        let ollama_base_url = db
            .get_setting(Self::OLLAMA_URL_KEY)
            .ok()
            .flatten()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| crate::ollama::DEFAULT_OLLAMA_URL.to_string());
        let default_model = db
            .get_setting(Self::DEFAULT_MODEL_KEY)
            .ok()
            .flatten()
            .unwrap_or_else(|| "llama3.2".to_string());
        let onboarding_complete = db
            .get_setting(Self::ONBOARDING_KEY)
            .ok()
            .flatten()
            .map(|v| v == "true")
            .unwrap_or(false);
        Self {
            ollama_base_url,
            default_model,
            onboarding_complete,
        }
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
        Ok(())
    }
}

pub fn app_data_dir() -> PathBuf {
    if let Some(dir) = dirs_data_local() {
        return dir.join("Record Plus");
    }
    std::env::temp_dir().join("record-plus")
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
