use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use thiserror::Error;

pub const DEFAULT_OLLAMA_URL: &str = "http://localhost:11434";

#[derive(Debug, Error)]
pub enum OllamaError {
    #[error("HTTP error: {0}")]
    Http(String),
    #[error("Connection failed: {0}")]
    Connection(String),
    #[error("API error: {0}")]
    Api(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
    pub modified_at: Option<String>,
    pub size: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct TagsResponse {
    models: Vec<TagModel>,
}

#[derive(Debug, Deserialize)]
struct TagModel {
    name: String,
    modified_at: Option<String>,
    size: Option<u64>,
}

#[derive(Debug, Serialize)]
struct GenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct GenerateResponse {
    response: String,
}

#[derive(Debug, Serialize)]
struct PullRequest {
    name: String,
    stream: bool,
}

pub struct OllamaClient {
    base_url: String,
    client: reqwest::blocking::Client,
}

impl OllamaClient {
    pub fn new(base_url: Option<String>) -> Self {
        Self {
            base_url: base_url
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| DEFAULT_OLLAMA_URL.to_string()),
            client: reqwest::blocking::Client::builder()
                .timeout(std::time::Duration::from_secs(120))
                .build()
                .expect("reqwest client"),
        }
    }

    pub fn check_connection(&self) -> Result<(), OllamaError> {
        let url = format!("{}/api/tags", self.base_url.trim_end_matches('/'));
        let resp = self
            .client
            .get(&url)
            .send()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        if resp.status().is_success() {
            Ok(())
        } else {
            Err(OllamaError::Http(format!("status {}", resp.status())))
        }
    }

    pub fn list_models(&self) -> Result<Vec<OllamaModel>, OllamaError> {
        let url = format!("{}/api/tags", self.base_url.trim_end_matches('/'));
        let resp = self
            .client
            .get(&url)
            .send()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        if !resp.status().is_success() {
            return Err(OllamaError::Http(format!("status {}", resp.status())));
        }
        let body: TagsResponse = resp
            .json()
            .map_err(|e| OllamaError::Api(e.to_string()))?;
        Ok(body
            .models
            .into_iter()
            .map(|m| OllamaModel {
                name: m.name,
                modified_at: m.modified_at,
                size: m.size,
            })
            .collect())
    }

    pub fn pull_model(&self, name: &str) -> Result<String, OllamaError> {
        let url = format!("{}/api/pull", self.base_url.trim_end_matches('/'));
        let resp = self
            .client
            .post(&url)
            .json(&PullRequest {
                name: name.to_string(),
                stream: false,
            })
            .send()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        if !resp.status().is_success() {
            return Err(OllamaError::Http(format!("status {}", resp.status())));
        }
        Ok(resp.text().unwrap_or_else(|_| "pull complete".into()))
    }

    pub fn test_model(&self, model: &str) -> Result<String, OllamaError> {
        self.generate(
            model,
            "Reply with exactly: NoteStack connection OK",
        )
    }

    pub fn generate_notes(&self, model: &str, transcript: &str) -> Result<String, OllamaError> {
        let prompt = format!(
            "You are a helpful meeting assistant. Given the following meeting transcript, produce concise meeting notes with:\n\
            1) Summary (2-3 sentences)\n\
            2) Key decisions\n\
            3) Action items (who/what if mentioned)\n\
            4) Open questions\n\n\
            Transcript:\n{}\n",
            transcript
        );
        self.generate(model, &prompt)
    }

    pub fn instant_summary(&self, model: &str, transcript: &str) -> Result<String, OllamaError> {
        let prompt = format!(
            "Write a very short instant meeting recap (3-5 bullet points max) from this transcript. Be concise.\n\nTranscript:\n{}\n",
            transcript
        );
        self.generate(model, &prompt)
    }

    pub fn enhance_notes(
        &self,
        model: &str,
        transcript: &str,
        manual_notes: &str,
        template_label: &str,
    ) -> Result<String, OllamaError> {
        let prompt = format!(
            "You enhance meeting notes for a {template} meeting.\n\
            The user wrote rough notes during the call (preserve their meaning; do not contradict them).\n\
            Merge context from the full transcript and return ONLY the AI-added sections in markdown.\n\
            Do not repeat the user's bullets verbatim — expand, structure, and fill gaps.\n\n\
            User notes during meeting:\n{manual}\n\n\
            Full transcript:\n{transcript}\n",
            template = template_label,
            manual = if manual_notes.trim().is_empty() {
                "(none — infer from transcript only)"
            } else {
                manual_notes
            },
            transcript = transcript
        );
        self.generate(model, &prompt)
    }

    pub fn extract_tasks_json(&self, model: &str, notes: &str) -> Result<String, OllamaError> {
        let prompt = format!(
            "Extract action items as a JSON array of objects with keys: title, assignee (or null), done (boolean false).\n\
            Return ONLY valid JSON, no markdown.\n\nNotes:\n{}\n",
            notes
        );
        self.generate(model, &prompt)
    }

    pub fn ask_across_meetings(
        &self,
        model: &str,
        question: &str,
        context: &str,
    ) -> Result<String, OllamaError> {
        let prompt = format!(
            "You answer questions using the user's local meeting history below. If unsure, say so.\n\n\
            Meeting history:\n{context}\n\n\
            Question: {question}\n",
            context = context,
            question = question
        );
        self.generate(model, &prompt)
    }

    pub fn daily_digest(&self, model: &str, context: &str) -> Result<String, OllamaError> {
        let prompt = format!(
            "Create a Daily Digest for the last 24 hours of meetings: highlights, decisions, and action items.\n\
            Use markdown sections.\n\n{}\n",
            context
        );
        self.generate(model, &prompt)
    }

    pub fn meeting_prep(&self, model: &str, event_title: &str, context: &str) -> Result<String, OllamaError> {
        let prompt = format!(
            "Create a short meeting brief for \"{title}\": who/what to expect, open threads from past notes, and suggested agenda.\n\n\
            Past notes context:\n{context}\n",
            title = event_title,
            context = context
        );
        self.generate(model, &prompt)
    }

    pub fn live_skill(
        &self,
        model: &str,
        skill: &str,
        transcript_so_far: &str,
    ) -> Result<String, OllamaError> {
        let instruction = match skill {
            "catch-up" => "Summarize what was discussed in the last few minutes so someone who zoned out can catch up.",
            "summarize" => "Summarize the meeting so far in bullet points.",
            "action-items" => "List action items mentioned so far.",
            "follow-up-questions" => "Suggest smart follow-up questions based on the discussion so far.",
            other => other,
        };
        let prompt = format!(
            "{instruction}\n\nTranscript so far:\n{transcript}\n",
            instruction = instruction,
            transcript = transcript_so_far
        );
        self.generate(model, &prompt)
    }

    /// Transcribe audio via Ollama's OpenAI-compatible endpoint (whisper, gemma4, etc.).
    pub fn transcribe_audio_file(&self, model: &str, path: &Path) -> Result<String, OllamaError> {
        let url = format!(
            "{}/v1/audio/transcriptions",
            self.base_url.trim_end_matches('/')
        );
        let bytes = std::fs::read(path).map_err(|e| {
            OllamaError::Api(format!("could not read audio file: {}", e))
        })?;
        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "recording.webm".to_string());

        let part = reqwest::blocking::multipart::Part::bytes(bytes)
            .file_name(file_name)
            .mime_str("application/octet-stream")
            .map_err(|e| OllamaError::Api(e.to_string()))?;
        let form = reqwest::blocking::multipart::Form::new()
            .text("model", model.to_string())
            .part("file", part);

        let resp = self
            .client
            .post(&url)
            .multipart(form)
            .send()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            return Err(OllamaError::Api(format!(
                "transcription failed ({}): {}",
                status,
                text
            )));
        }
        let body = resp
            .text()
            .map_err(|e| OllamaError::Api(e.to_string()))?;
        parse_transcription_response(&body)
    }

    fn generate(&self, model: &str, prompt: &str) -> Result<String, OllamaError> {
        let url = format!("{}/api/generate", self.base_url.trim_end_matches('/'));
        let resp = self
            .client
            .post(&url)
            .json(&GenerateRequest {
                model: model.to_string(),
                prompt: prompt.to_string(),
                stream: false,
            })
            .send()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            return Err(OllamaError::Api(format!("{} — {}", status, text)));
        }
        let body: GenerateResponse = resp
            .json()
            .map_err(|e| OllamaError::Api(e.to_string()))?;
        Ok(body.response.trim().to_string())
    }
}

#[derive(Debug, Deserialize)]
struct TranscriptionResponse {
    text: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OllamaInstallStatus {
    pub installed: bool,
    pub message: String,
}

pub fn ollama_binary_path() -> Option<PathBuf> {
    if let Ok(path) = which_command("ollama") {
        return Some(path);
    }
    for candidate in [
        "/usr/local/bin/ollama",
        "/opt/homebrew/bin/ollama",
        "/usr/bin/ollama",
    ] {
        let p = PathBuf::from(candidate);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

pub fn is_ollama_installed() -> bool {
    ollama_binary_path().is_some()
}

pub fn install_ollama() -> Result<String, String> {
    if is_ollama_installed() {
        launch_ollama_app();
        return Ok("Ollama is already installed. Started the Ollama app if needed.".into());
    }

    #[cfg(target_os = "macos")]
    {
        if command_exists("brew") {
            let output = Command::new("brew")
                .args(["install", "--cask", "ollama"])
                .output()
                .map_err(|e| format!("Failed to run brew: {}", e))?;
            if output.status.success() || is_ollama_installed() {
                launch_ollama_app();
                return Ok("Installed Ollama with Homebrew. Open the Ollama app if the API is not up yet.".into());
            }
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            if !stderr.trim().is_empty() || !stdout.trim().is_empty() {
                return Err(format!(
                    "Homebrew install failed: {}{}",
                    stdout.trim(),
                    if stderr.trim().is_empty() {
                        String::new()
                    } else {
                        format!("\n{}", stderr.trim())
                    }
                ));
            }
        }

        let output = Command::new("sh")
            .arg("-c")
            .arg("curl -fsSL https://ollama.com/install.sh | sh")
            .output()
            .map_err(|e| format!("Failed to run Ollama install script: {}", e))?;
        if output.status.success() || is_ollama_installed() {
            launch_ollama_app();
            return Ok("Installed Ollama using the official install script.".into());
        }
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Ollama install script failed: {}",
            stderr.trim()
        ));
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("sh")
            .arg("-c")
            .arg("curl -fsSL https://ollama.com/install.sh | sh")
            .output()
            .map_err(|e| format!("Failed to run Ollama install script: {}", e))?;
        if output.status.success() || is_ollama_installed() {
            let _ = Command::new("ollama").arg("serve").spawn();
            return Ok("Installed Ollama using the official install script.".into());
        }
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Ollama install script failed: {}",
            stderr.trim()
        ));
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        Err("Automatic Ollama install is not supported on this platform. Download from https://ollama.com/download.".into())
    }
}

fn launch_ollama_app() {
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").args(["-a", "Ollama"]).spawn();
    }
}

fn command_exists(name: &str) -> bool {
    which_command(name).is_some()
}

fn which_command(name: &str) -> Result<PathBuf, ()> {
    let path = std::env::var_os("PATH").unwrap_or_default();
    for dir in std::env::split_paths(&path) {
        let candidate = dir.join(name);
        if candidate.is_file() {
            return Ok(candidate);
        }
    }
    Err(())
}

fn parse_transcription_response(body: &str) -> Result<String, OllamaError> {
    let trimmed = body.trim();
    if trimmed.is_empty() {
        return Err(OllamaError::Api("empty transcription response".into()));
    }
    if let Ok(parsed) = serde_json::from_str::<TranscriptionResponse>(trimmed) {
        if let Some(text) = parsed.text {
            if !text.trim().is_empty() {
                return Ok(text.trim().to_string());
            }
        }
    }
    Ok(trimmed.to_string())
}
