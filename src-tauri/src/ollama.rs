use serde::{Deserialize, Serialize};
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
            "Reply with exactly: Record Plus connection OK",
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
