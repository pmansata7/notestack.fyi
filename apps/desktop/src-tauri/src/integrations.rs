use crate::db::Transcript;
use crate::state::AppSettings;
use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum IntegrationError {
    #[error("{0}")]
    Message(String),
    #[error("{0}")]
    Http(#[from] reqwest::Error),
    #[error("{0}")]
    Json(#[from] serde_json::Error),
}

impl IntegrationError {
    fn msg(s: impl Into<String>) -> Self {
        Self::Message(s.into())
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ShareResult {
    pub channel: String,
    pub ok: bool,
    pub message: String,
}

pub fn meeting_markdown(t: &Transcript) -> String {
    let mut md = format!("# {}\n\n", t.title.trim());
    if !t.instant_summary.trim().is_empty() {
        md.push_str("## Summary\n");
        md.push_str(t.instant_summary.trim());
        md.push('\n');
        md.push('\n');
    }
    if !t.manual_notes.trim().is_empty() {
        md.push_str("## Your notes\n");
        md.push_str(t.manual_notes.trim());
        md.push('\n');
        md.push('\n');
    }
    if !t.ai_additions.trim().is_empty() {
        md.push_str("## AI additions\n");
        md.push_str(t.ai_additions.trim());
        md.push('\n');
        md.push('\n');
    }
    if !t.tasks_json.trim().is_empty() && t.tasks_json != "[]" {
        md.push_str("## Action items\n");
        if let Ok(tasks) = serde_json::from_str::<Vec<serde_json::Value>>(&t.tasks_json) {
            for task in tasks {
                if let Some(title) = task.get("title").and_then(|v| v.as_str()) {
                    md.push_str("- ");
                    md.push_str(title);
                    if let Some(a) = task.get("assignee").and_then(|v| v.as_str()) {
                        if !a.is_empty() {
                            md.push_str(" (@");
                            md.push_str(a);
                            md.push(')');
                        }
                    }
                    md.push('\n');
                }
            }
        }
        md.push('\n');
    }
    if !t.transcript_text.trim().is_empty() {
        md.push_str("## Transcript\n");
        let body = t.transcript_text.trim();
        let excerpt = if body.len() > 6000 {
            format!("{}…\n\n_(transcript truncated for export)_", &body[..6000])
        } else {
            body.to_string()
        };
        md.push_str(&excerpt);
        md.push('\n');
    }
    md
}

fn slack_body(t: &Transcript) -> serde_json::Value {
    let summary = if !t.instant_summary.trim().is_empty() {
        t.instant_summary.trim().to_string()
    } else if !t.ai_additions.trim().is_empty() {
        t.ai_additions.lines().take(6).collect::<Vec<_>>().join("\n")
    } else {
        t.manual_notes.lines().take(6).collect::<Vec<_>>().join("\n")
    };
    let fallback = if summary.is_empty() {
        "Meeting notes from NoteStack.".to_string()
    } else {
        summary
    };
    json!({
        "text": format!("*{}*", t.title.trim()),
        "blocks": [
            {
                "type": "header",
                "text": { "type": "plain_text", "text": t.title.trim(), "emoji": true }
            },
            {
                "type": "section",
                "text": { "type": "mrkdwn", "text": fallback }
            },
            {
                "type": "context",
                "elements": [{ "type": "mrkdwn", "text": "_Shared from NoteStack on your Mac — local-first meeting notes._" }]
            }
        ]
    })
}

pub fn share_slack(webhook_url: &str, t: &Transcript) -> Result<(), IntegrationError> {
    let url = webhook_url.trim();
    if url.is_empty() {
        return Err(IntegrationError::msg("Slack webhook URL is not configured"));
    }
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;
    let res = client.post(url).json(&slack_body(t)).send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err(IntegrationError::msg(format!(
            "Slack returned {}",
            res.status()
        )))
    }
}

fn notion_paragraphs(text: &str) -> Vec<serde_json::Value> {
    const CHUNK: usize = 1800;
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return vec![json!({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{ "type": "text", "text": { "content": "(empty)" } }]
            }
        })];
    }
    trimmed
        .split_inclusive('\n')
        .collect::<Vec<_>>()
        .chunks(8)
        .map(|lines| lines.concat())
        .flat_map(|section| {
            section
                .as_bytes()
                .chunks(CHUNK)
                .map(|chunk| String::from_utf8_lossy(chunk).to_string())
                .collect::<Vec<_>>()
        })
        .map(|content| {
            json!({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{ "type": "text", "text": { "content": content } }]
                }
            })
        })
        .collect()
}

pub fn share_notion(token: &str, database_id: &str, t: &Transcript) -> Result<(), IntegrationError> {
    let token = token.trim();
    let database_id = database_id.trim();
    if token.is_empty() {
        return Err(IntegrationError::msg("Notion integration token is not configured"));
    }
    if database_id.is_empty() {
        return Err(IntegrationError::msg("Notion database ID is not configured"));
    }
    let md = meeting_markdown(t);
    let mut children = notion_paragraphs(&md);
    if children.len() > 95 {
        children.truncate(95);
    }
    let body = json!({
        "parent": { "database_id": database_id },
        "properties": {
            "Name": {
                "title": [{ "text": { "content": t.title.trim().chars().take(200).collect::<String>() } }]
            }
        },
        "children": children
    });
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(45))
        .build()?;
    let res = client
        .post("https://api.notion.com/v1/pages")
        .header("Authorization", format!("Bearer {}", token))
        .header("Notion-Version", "2022-06-28")
        .json(&body)
        .send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        let status = res.status();
        let err_body = res.text().unwrap_or_default();
        Err(IntegrationError::msg(format!(
            "Notion API {} — {}",
            status,
            err_body.chars().take(240).collect::<String>()
        )))
    }
}

pub fn share_zapier(hook_url: &str, t: &Transcript) -> Result<(), IntegrationError> {
    let url = hook_url.trim();
    if url.is_empty() {
        return Err(IntegrationError::msg("Zapier webhook URL is not configured"));
    }
    let body = json!({
        "source": "notestack",
        "event": "meeting_notes_enhanced",
        "id": t.id,
        "title": t.title,
        "created_at": t.created_at,
        "template_id": t.template_id,
        "instant_summary": t.instant_summary,
        "manual_notes": t.manual_notes,
        "ai_additions": t.ai_additions,
        "tasks_json": t.tasks_json,
        "transcript_excerpt": t.transcript_text.chars().take(8000).collect::<String>(),
        "markdown": meeting_markdown(t),
    });
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;
    let res = client.post(url).json(&body).send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err(IntegrationError::msg(format!(
            "Zapier hook returned {}",
            res.status()
        )))
    }
}

pub fn test_slack(webhook_url: &str) -> Result<(), IntegrationError> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()?;
    let url = webhook_url.trim();
    if url.is_empty() {
        return Err(IntegrationError::msg("Slack webhook URL is empty"));
    }
    let res = client
        .post(url)
        .json(&json!({
            "text": "NoteStack connector test — you can delete this message."
        }))
        .send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err(IntegrationError::msg(format!("Slack test failed: {}", res.status())))
    }
}

pub fn test_zapier(hook_url: &str) -> Result<(), IntegrationError> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()?;
    let url = hook_url.trim();
    if url.is_empty() {
        return Err(IntegrationError::msg("Zapier hook URL is empty"));
    }
    let res = client
        .post(url)
        .json(&json!({
            "source": "notestack",
            "event": "connector_test",
            "message": "NoteStack Zapier hook is working."
        }))
        .send()?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err(IntegrationError::msg(format!("Zapier test failed: {}", res.status())))
    }
}

pub fn auto_share_after_enhance(settings: &AppSettings, t: &Transcript) -> Vec<ShareResult> {
    let mut results = Vec::new();
    if settings.slack_auto_post_on_enhance && !settings.slack_webhook_url.trim().is_empty() {
        let r = share_slack(&settings.slack_webhook_url, t);
        results.push(ShareResult {
            channel: "slack".to_string(),
            ok: r.is_ok(),
            message: r
                .err()
                .map(|e| e.to_string())
                .unwrap_or_else(|| "Posted to Slack.".to_string()),
        });
    }
    if settings.notion_auto_post_on_enhance
        && !settings.notion_integration_token.trim().is_empty()
        && !settings.notion_database_id.trim().is_empty()
    {
        let r = share_notion(
            &settings.notion_integration_token,
            &settings.notion_database_id,
            t,
        );
        results.push(ShareResult {
            channel: "notion".to_string(),
            ok: r.is_ok(),
            message: r
                .err()
                .map(|e| e.to_string())
                .unwrap_or_else(|| "Saved to Notion.".to_string()),
        });
    }
    if settings.zapier_auto_post_on_enhance && !settings.zapier_webhook_url.trim().is_empty() {
        let r = share_zapier(&settings.zapier_webhook_url, t);
        results.push(ShareResult {
            channel: "zapier".to_string(),
            ok: r.is_ok(),
            message: r
                .err()
                .map(|e| e.to_string())
                .unwrap_or_else(|| "Sent to Zapier.".to_string()),
        });
    }
    results
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ShareChannel {
    Slack,
    Notion,
    Zapier,
}

pub fn share_channel(
    settings: &AppSettings,
    channel: ShareChannel,
    t: &Transcript,
) -> Result<(), IntegrationError> {
    match channel {
        ShareChannel::Slack => share_slack(&settings.slack_webhook_url, t),
        ShareChannel::Notion => share_notion(
            &settings.notion_integration_token,
            &settings.notion_database_id,
            t,
        ),
        ShareChannel::Zapier => share_zapier(&settings.zapier_webhook_url, t),
    }
}