use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use thiserror::Error;

pub const DEFAULT_OLLAMA_URL: &str = "http://localhost:11434";
/// Ollama model with native audio input (gemma4 E2B/E4B variants).
pub const DEFAULT_TRANSCRIPTION_MODEL: &str = "gemma4:e4b";

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
    model: String,
    stream: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PullProgress {
    pub status: String,
    pub completed: Option<u64>,
    pub total: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct PullStreamLine {
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    error: Option<String>,
    #[serde(default)]
    completed: Option<u64>,
    #[serde(default)]
    total: Option<u64>,
}

fn friendly_pull_error(error: &str) -> String {
    let trimmed = error.trim();
    if trimmed.is_empty() {
        return "Model download failed.".into();
    }
    let lower = trimmed.to_ascii_lowercase();
    if lower.contains("file does not exist")
        || lower.contains("not found")
        || lower.contains("invalid model")
    {
        return format!(
            "{trimmed} There is no Ollama model named 'whisper'. For speech, use an audio-capable model such as gemma4:e4b (run: ollama pull gemma4:e4b).",
            trimmed = trimmed
        );
    }
    trimmed.to_string()
}

fn parse_pull_stream_line(line: &str) -> Result<Option<PullStreamLine>, OllamaError> {
    let parsed: PullStreamLine = serde_json::from_str(line)
        .map_err(|e| OllamaError::Api(e.to_string()))?;
    if let Some(err) = parsed.error {
        return Err(OllamaError::Api(friendly_pull_error(&err)));
    }
    if parsed.status.is_none() && parsed.completed.is_none() && parsed.total.is_none() {
        return Ok(None);
    }
    Ok(Some(parsed))
}

#[derive(Debug, Deserialize)]
struct PullResponse {
    status: Option<String>,
}

fn friendly_pull_message(model: &str, body: &str) -> String {
    let trimmed = body.trim();
    if trimmed.is_empty()
        || trimmed.eq_ignore_ascii_case("success")
        || trimmed == "download complete"
    {
        return format!(
            "{} is downloaded and ready to use.",
            display_model_name(model)
        );
    }
    if let Ok(parsed) = serde_json::from_str::<PullResponse>(trimmed) {
        if parsed.status.as_deref() == Some("success") {
            return format!(
                "{} is downloaded and ready to use.",
                display_model_name(model)
            );
        }
    }
    if trimmed.starts_with('{') || trimmed.starts_with('[') {
        return format!(
            "{} is downloaded and ready to use.",
            display_model_name(model)
        );
    }
    trimmed.to_string()
}

fn display_model_name(name: &str) -> String {
    name.strip_suffix(":latest")
        .unwrap_or(name)
        .to_string()
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

    pub fn pull_model<F>(&self, name: &str, mut on_progress: F) -> Result<String, OllamaError>
    where
        F: FnMut(PullProgress),
    {
        use std::io::{BufRead, BufReader};

        let url = format!("{}/api/pull", self.base_url.trim_end_matches('/'));
        let pull_client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_secs(7200))
            .build()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        let resp = pull_client
            .post(&url)
            .json(&PullRequest {
                model: name.to_string(),
                stream: true,
            })
            .send()
            .map_err(|e| OllamaError::Connection(e.to_string()))?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().unwrap_or_default();
            if let Ok(parsed) = serde_json::from_str::<PullStreamLine>(&text) {
                if let Some(err) = parsed.error {
                    return Err(OllamaError::Api(friendly_pull_error(&err)));
                }
            }
            return Err(OllamaError::Http(format!("status {} — {}", status, text)));
        }
        let reader = BufReader::new(resp);
        let mut last_status = String::from("download complete");
        for line in reader.lines() {
            let line = line.map_err(|e| OllamaError::Api(e.to_string()))?;
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            let Some(parsed) = parse_pull_stream_line(line)? else {
                continue;
            };
            let status = parsed
                .status
                .clone()
                .unwrap_or_else(|| "downloading".to_string());
            last_status = status.clone();
            on_progress(PullProgress {
                status,
                completed: parsed.completed,
                total: parsed.total,
            });
            if last_status == "success" {
                break;
            }
        }
        Ok(friendly_pull_message(name, &last_status))
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

    /// Transcribe in-memory audio (WAV preferred) via Ollama's OpenAI-compatible endpoint.
    pub fn transcribe_audio_bytes(
        &self,
        model: &str,
        bytes: &[u8],
        file_name: &str,
    ) -> Result<String, OllamaError> {
        let (payload, name, mime) = normalize_audio_payload(bytes, file_name);
        self.post_audio_transcription(model, payload, &name, mime)
    }

    /// Transcribe audio via Ollama's OpenAI-compatible endpoint (whisper, gemma4, etc.).
    pub fn transcribe_audio_file(&self, model: &str, path: &Path) -> Result<String, OllamaError> {
        let (bytes, file_name) = load_audio_for_transcription(path)?;
        self.transcribe_audio_bytes(model, &bytes, &file_name)
    }

    /// Label speaker turns in a raw transcript (local LLM; not true diarization).
    pub fn label_speakers(&self, model: &str, raw_transcript: &str) -> Result<String, OllamaError> {
        let trimmed = raw_transcript.trim();
        if trimmed.is_empty() {
            return Ok(String::new());
        }
        let prompt = format!(
            "Format this meeting transcript with speaker labels.\n\
            Rules:\n\
            - Prefix each turn with \"Speaker 1:\", \"Speaker 2:\", etc.\n\
            - Use real names only if they are explicitly spoken in the transcript.\n\
            - One line per speaker turn; keep the original wording.\n\
            - Do not add commentary or invent dialogue.\n\
            - Output only the labeled transcript.\n\n\
            Transcript:\n{}\n",
            trimmed
        );
        self.generate(model, &prompt)
    }

    fn post_audio_transcription(
        &self,
        model: &str,
        bytes: Vec<u8>,
        file_name: &str,
        mime: &str,
    ) -> Result<String, OllamaError> {
        let url = format!(
            "{}/v1/audio/transcriptions",
            self.base_url.trim_end_matches('/')
        );

        let part = reqwest::blocking::multipart::Part::bytes(bytes)
            .file_name(file_name.to_string())
            .mime_str(mime)
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

fn load_audio_for_transcription(path: &Path) -> Result<(Vec<u8>, String), OllamaError> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if ext == "wav" {
        let bytes = std::fs::read(path).map_err(|e| {
            OllamaError::Api(format!("could not read audio file: {}", e))
        })?;
        return Ok((bytes, "recording.wav".to_string()));
    }
    if let Some(wav) = convert_to_wav_with_ffmpeg(path) {
        return Ok((wav, "recording.wav".to_string()));
    }
    let bytes = std::fs::read(path).map_err(|e| {
        OllamaError::Api(format!("could not read audio file: {}", e))
    })?;
    let file_name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "recording.webm".to_string());
    Ok((bytes, file_name))
}

fn convert_to_wav_with_ffmpeg(path: &Path) -> Option<Vec<u8>> {
    use std::process::Stdio;
    let output = Command::new("ffmpeg")
        .args(["-nostdin", "-loglevel", "error", "-i"])
        .arg(path)
        .args(["-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();
    match output {
        Ok(out) if out.status.success() && !out.stdout.is_empty() => Some(out.stdout),
        _ => None,
    }
}

fn normalize_audio_payload(
    bytes: &[u8],
    file_name: &str,
) -> (Vec<u8>, String, &'static str) {
    let lower = file_name.to_ascii_lowercase();
    if lower.ends_with(".wav") || looks_like_wav(bytes) {
        return (bytes.to_vec(), "recording.wav".to_string(), "audio/wav");
    }
    (
        bytes.to_vec(),
        file_name.to_string(),
        "application/octet-stream",
    )
}

fn looks_like_wav(bytes: &[u8]) -> bool {
    bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WAVE"
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
        "/opt/homebrew/bin/ollama",
        "/usr/local/bin/ollama",
        "/usr/bin/ollama",
        "/Applications/Ollama.app/Contents/Resources/ollama",
    ] {
        let p = PathBuf::from(candidate);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

pub fn is_ollama_installed() -> bool {
    ollama_binary_path().is_some() || ollama_app_bundle_path().is_some()
}

fn ollama_app_bundle_path() -> Option<PathBuf> {
    let bundle = PathBuf::from("/Applications/Ollama.app");
    if bundle.is_dir() {
        return Some(bundle);
    }
    None
}

fn brew_binary_path() -> Option<PathBuf> {
    if let Ok(path) = which_command("brew") {
        return Some(path);
    }
    for candidate in ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"] {
        let p = PathBuf::from(candidate);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

/// macOS GUI apps often launch with a minimal PATH; Homebrew lives outside it.
fn command_with_extended_path(program: &Path) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(target_os = "macos")]
    {
        let path = std::env::var("PATH").unwrap_or_default();
        let extended = if path.is_empty() {
            "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin".to_string()
        } else {
            format!("/opt/homebrew/bin:/usr/local/bin:{}", path)
        };
        cmd.env("PATH", extended);
    }
    cmd
}

pub fn install_ollama() -> Result<String, String> {
    if is_ollama_installed() {
        launch_ollama_app();
        return Ok("Ollama is already installed. Started the Ollama app if needed.".into());
    }

    #[cfg(target_os = "macos")]
    {
        if let Some(brew) = brew_binary_path() {
            let output = command_with_extended_path(&brew)
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
            return Err(
                "Homebrew install failed (no output). Try: brew install --cask ollama"
                    .into(),
            );
        }

        let output = command_with_extended_path(Path::new("sh"))
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

fn is_refusal_transcription(text: &str) -> bool {
    let lower = text.to_lowercase();
    lower.contains("cannot transcribe")
        || lower.contains("no audio was provided")
        || lower.contains("please provide the audio")
        || lower.contains("unable to transcribe")
}

fn parse_transcription_response(body: &str) -> Result<String, OllamaError> {
    let trimmed = body.trim();
    if trimmed.is_empty() {
        return Err(OllamaError::Api("empty transcription response".into()));
    }
    if let Ok(parsed) = serde_json::from_str::<TranscriptionResponse>(trimmed) {
        if let Some(text) = parsed.text {
            if !text.trim().is_empty() {
                let out = text.trim().to_string();
                if is_refusal_transcription(&out) {
                    return Ok(String::new());
                }
                return Ok(out);
            }
        }
    }
    if is_refusal_transcription(trimmed) {
        return Ok(String::new());
    }
    Ok(trimmed.to_string())
}

#[cfg(test)]
mod pull_message_tests {
    use super::{display_model_name, friendly_pull_message, parse_pull_stream_line};

    #[test]
    fn pull_error_line_returns_actionable_message() {
        let err = parse_pull_stream_line(r#"{"error":"pull model manifest: file does not exist"}"#)
            .unwrap_err()
            .to_string();
        assert!(err.contains("gemma4:e4b"));
        assert!(!err.contains("missing field"));
    }

    #[test]
    fn pull_progress_line_without_status_is_skipped() {
        let parsed = parse_pull_stream_line(r#"{"completed":10,"total":100}"#).unwrap();
        assert!(parsed.is_none());
    }

    #[test]
    fn pull_status_line_parses() {
        let parsed = parse_pull_stream_line(r#"{"status":"pulling manifest"}"#)
            .unwrap()
            .expect("line");
        assert_eq!(parsed.status.as_deref(), Some("pulling manifest"));
    }

    #[test]
    fn success_json_becomes_friendly_message() {
        let msg = friendly_pull_message("llama3.2", r#"{"status":"success"}"#);
        assert!(msg.contains("llama3.2"));
        assert!(msg.contains("ready"));
        assert!(!msg.contains('{'));
    }

    #[test]
    fn success_status_becomes_friendly_message() {
        let msg = friendly_pull_message("llama3.2", "success");
        assert!(msg.contains("llama3.2"));
        assert!(!msg.eq("success"));
    }

    #[test]
    fn strips_latest_suffix_for_display() {
        assert_eq!(display_model_name("llama3.2:latest"), "llama3.2");
    }
}
