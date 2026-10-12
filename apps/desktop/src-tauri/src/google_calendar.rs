use crate::db::Database;
use crate::state::CalendarEvent;
use base64::Engine;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::mpsc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use thiserror::Error;
use tiny_http::{Header, Response, Server};

const REDIRECT_PORT: u16 = 14528;
const REDIRECT_PATH: &str = "/oauth2/callback";
const CALENDAR_SCOPE: &str = "https://www.googleapis.com/auth/calendar.readonly";
const EMAIL_SCOPE: &str = "https://www.googleapis.com/auth/userinfo.email";

pub const GOOGLE_REFRESH_TOKEN_KEY: &str = "google_refresh_token";
pub const GOOGLE_ACCESS_TOKEN_KEY: &str = "google_access_token";
pub const GOOGLE_TOKEN_EXPIRY_KEY: &str = "google_token_expiry_ms";
pub const GOOGLE_ACCOUNT_EMAIL_KEY: &str = "google_account_email";
pub const GOOGLE_LAST_SYNC_KEY: &str = "google_calendar_last_sync_at";

#[derive(Debug, Error)]
pub enum GoogleCalendarError {
    #[error("{0}")]
    Message(String),
    #[error("{0}")]
    Http(#[from] reqwest::Error),
    #[error("{0}")]
    Json(#[from] serde_json::Error),
}

impl GoogleCalendarError {
    fn msg(s: impl Into<String>) -> Self {
        Self::Message(s.into())
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct GoogleCalendarStatus {
    pub connected: bool,
    pub email: Option<String>,
    pub last_sync_at: Option<String>,
    pub client_id_configured: bool,
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct GoogleEventsList {
    items: Option<Vec<GoogleEvent>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleEvent {
    id: Option<String>,
    summary: Option<String>,
    start: Option<GoogleEventTime>,
    end: Option<GoogleEventTime>,
    hangout_link: Option<String>,
    conference_data: Option<GoogleConferenceData>,
    location: Option<String>,
    attendees: Option<Vec<GoogleAttendee>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleEventTime {
    date_time: Option<String>,
    date: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleConferenceData {
    entry_points: Option<Vec<GoogleEntryPoint>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleEntryPoint {
    uri: Option<String>,
    entry_point_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleAttendee {
    email: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UserInfo {
    email: Option<String>,
}

pub fn resolve_client_id(settings_client_id: &str) -> Option<String> {
    let from_settings = settings_client_id.trim();
    if !from_settings.is_empty() {
        return Some(from_settings.to_string());
    }
    if let Ok(id) = std::env::var("NOTESTACK_GOOGLE_CLIENT_ID") {
        let trimmed = id.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    None
}

pub fn status(db: &Database, settings_client_id: &str) -> Result<GoogleCalendarStatus, GoogleCalendarError> {
    let refresh = db
        .get_setting(GOOGLE_REFRESH_TOKEN_KEY)
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    let email = db
        .get_setting(GOOGLE_ACCOUNT_EMAIL_KEY)
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    let last_sync = db
        .get_setting(GOOGLE_LAST_SYNC_KEY)
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    Ok(GoogleCalendarStatus {
        connected: refresh.map(|t| !t.is_empty()).unwrap_or(false),
        email,
        last_sync_at: last_sync,
        client_id_configured: resolve_client_id(settings_client_id).is_some(),
    })
}

pub fn disconnect(db: &Database) -> Result<(), GoogleCalendarError> {
    for key in [
        GOOGLE_REFRESH_TOKEN_KEY,
        GOOGLE_ACCESS_TOKEN_KEY,
        GOOGLE_TOKEN_EXPIRY_KEY,
        GOOGLE_ACCOUNT_EMAIL_KEY,
        GOOGLE_LAST_SYNC_KEY,
    ] {
        db.set_setting(key, "")
            .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    }
    Ok(())
}

fn pkce_pair() -> (String, String) {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let verifier = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes);
    let digest = Sha256::digest(verifier.as_bytes());
    let challenge = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(digest);
    (verifier, challenge)
}

fn redirect_uri() -> String {
    format!("http://127.0.0.1:{}{}", REDIRECT_PORT, REDIRECT_PATH)
}

fn wait_for_auth_code() -> Result<String, GoogleCalendarError> {
    let server = Server::http(format!("127.0.0.1:{}", REDIRECT_PORT))
        .map_err(|e| GoogleCalendarError::msg(format!("OAuth listener failed: {}", e)))?;

    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        for request in server.incoming_requests() {
            let url = request.url().to_string();
            let code = url
                .split('?')
                .nth(1)
                .and_then(|q| {
                    q.split('&')
                        .find_map(|pair| {
                            let mut parts = pair.splitn(2, '=');
                            let key = parts.next()?;
                            let val = parts.next()?;
                            if key == "code" {
                                Some(
                                    urlencoding::decode(val)
                                        .map(|s| s.into_owned())
                                        .unwrap_or_else(|_| val.to_string()),
                                )
                            } else {
                                None
                            }
                        })
                });
            let body = if code.is_some() {
                "<html><body><p>Connected to NoteStack. You can close this tab.</p></body></html>"
            } else {
                "<html><body><p>Authorization failed. Return to NoteStack and try again.</p></body></html>"
            };
            let response = Response::from_string(body).with_header(
                Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..])
                    .unwrap(),
            );
            let _ = request.respond(response);
            let _ = tx.send(code);
            break;
        }
    });

    match rx.recv_timeout(Duration::from_secs(180)) {
        Ok(Some(code)) if !code.is_empty() => Ok(code),
        Ok(_) => Err(GoogleCalendarError::msg("Google did not return an authorization code")),
        Err(_) => Err(GoogleCalendarError::msg(
            "Timed out waiting for Google sign-in (3 minutes)",
        )),
    }
}

pub fn run_oauth_flow(
    client_id: &str,
    open_url: &dyn Fn(&str) -> Result<(), String>,
) -> Result<TokenResponse, GoogleCalendarError> {
    let client_id = resolve_client_id(client_id)
        .ok_or_else(|| GoogleCalendarError::msg(
            "Add a Google OAuth client ID in Settings (Desktop app, redirect URI http://127.0.0.1:14528/oauth2/callback)",
        ))?;

    let (verifier, challenge) = pkce_pair();
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent&code_challenge={}&code_challenge_method=S256",
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri()),
        urlencoding::encode(&format!("{} {}", CALENDAR_SCOPE, EMAIL_SCOPE)),
        urlencoding::encode(&challenge),
    );

    open_url(&auth_url).map_err(GoogleCalendarError::msg)?;
    let code = wait_for_auth_code()?;
    let client = reqwest::blocking::Client::new();
    client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client_id.as_str()),
            ("grant_type", "authorization_code"),
            ("code", code.as_str()),
            ("redirect_uri", redirect_uri().as_str()),
            ("code_verifier", verifier.as_str()),
        ])
        .send()?
        .error_for_status()
        .map_err(|e| GoogleCalendarError::msg(format!("Token exchange failed: {}", e)))?
        .json::<TokenResponse>()
}

pub fn finalize_connection(
    db: &Database,
    client_id: &str,
    token_res: &TokenResponse,
) -> Result<GoogleCalendarStatus, GoogleCalendarError> {
    store_tokens(db, token_res)?;

    let client = reqwest::blocking::Client::new();
    if let Ok(info) = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(&token_res.access_token)
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.json::<UserInfo>())
    {
        if let Some(email) = info.email {
            db.set_setting(GOOGLE_ACCOUNT_EMAIL_KEY, &email)
                .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
        }
    }

    status(db, client_id)
}

fn store_tokens(db: &Database, token: &TokenResponse) -> Result<(), GoogleCalendarError> {
    db.set_setting(GOOGLE_ACCESS_TOKEN_KEY, &token.access_token)
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    if let Some(refresh) = &token.refresh_token {
        db.set_setting(GOOGLE_REFRESH_TOKEN_KEY, refresh)
            .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    }
    let expiry_ms = token
        .expires_in
        .map(|secs| {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as i64
                + secs * 1000
        })
        .unwrap_or(0);
    db.set_setting(GOOGLE_TOKEN_EXPIRY_KEY, &expiry_ms.to_string())
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;
    Ok(())
}

fn access_token(db: &Database, client_id: &str) -> Result<String, GoogleCalendarError> {
    let client_id = resolve_client_id(client_id)
        .ok_or_else(|| GoogleCalendarError::msg("Google client ID not configured"))?;
    let expiry = db
        .get_setting(GOOGLE_TOKEN_EXPIRY_KEY)
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(0);
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;

    if expiry > now_ms + 60_000 {
        if let Some(token) = db
            .get_setting(GOOGLE_ACCESS_TOKEN_KEY)
            .map_err(|e| GoogleCalendarError::msg(e.to_string()))?
        {
            if !token.is_empty() {
                return Ok(token);
            }
        }
    }

    let refresh = db
        .get_setting(GOOGLE_REFRESH_TOKEN_KEY)
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?
        .filter(|t| !t.is_empty())
        .ok_or_else(|| GoogleCalendarError::msg("Google Calendar not connected"))?;

    let client = reqwest::blocking::Client::new();
    let token_res = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client_id.as_str()),
            ("grant_type", "refresh_token"),
            ("refresh_token", refresh.as_str()),
        ])
        .send()?
        .error_for_status()
        .map_err(|e| GoogleCalendarError::msg(format!("Token refresh failed: {}", e)))?
        .json::<TokenResponse>()?;

    store_tokens(db, &token_res)?;
    Ok(token_res.access_token)
}

pub fn classify_meeting_url(url: &str) -> Option<String> {
    let lower = url.to_lowercase();
    if lower.contains("zoom.us") || lower.contains("zoom.com") {
        return Some("zoom".to_string());
    }
    if lower.contains("teams.microsoft.com") || lower.contains("teams.live.com") {
        return Some("teams".to_string());
    }
    if lower.contains("meet.google.com") {
        return Some("meet".to_string());
    }
    if lower.contains("webex.com") {
        return Some("webex".to_string());
    }
    None
}

fn pick_meeting_url(event: &GoogleEvent) -> Option<String> {
    if let Some(link) = &event.hangout_link {
        if !link.is_empty() {
            return Some(link.clone());
        }
    }
    if let Some(conf) = &event.conference_data {
        for ep in conf.entry_points.as_deref().unwrap_or(&[]) {
            if ep.entry_point_type.as_deref() == Some("video") {
                if let Some(uri) = &ep.uri {
                    if !uri.is_empty() {
                        return Some(uri.clone());
                    }
                }
            }
        }
        for ep in conf.entry_points.as_deref().unwrap_or(&[]) {
            if let Some(uri) = &ep.uri {
                if !uri.is_empty() {
                    return Some(uri.clone());
                }
            }
        }
    }
    if let Some(loc) = &event.location {
        if classify_meeting_url(loc).is_some() {
            return Some(loc.clone());
        }
    }
    None
}

fn event_start_iso(time: &GoogleEventTime) -> Option<String> {
    if let Some(dt) = &time.date_time {
        return Some(dt.clone());
    }
    if let Some(d) = &time.date {
        return Some(format!("{}T00:00:00Z", d));
    }
    None
}

fn duration_minutes(start: &GoogleEventTime, end: &GoogleEventTime) -> i64 {
    let start_s = event_start_iso(start);
    let end_s = event_start_iso(end);
    match (start_s, end_s) {
        (Some(a), Some(b)) => {
            let a_ms = chrono::DateTime::parse_from_rfc3339(&a)
                .map(|d| d.timestamp_millis())
                .unwrap_or(0);
            let b_ms = chrono::DateTime::parse_from_rfc3339(&b)
                .map(|d| d.timestamp_millis())
                .unwrap_or(a_ms);
            ((b_ms - a_ms).max(0) / 60_000).max(1)
        }
        _ => 30,
    }
}

pub fn sync_events(db: &Database, client_id: &str) -> Result<Vec<CalendarEvent>, GoogleCalendarError> {
    let token = access_token(db, client_id)?;
    let now = chrono::Utc::now();
    let time_min = now.to_rfc3339();
    let time_max = (now + chrono::Duration::days(14)).to_rfc3339();
    let url = format!(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin={}&timeMax={}&maxResults=80",
        urlencoding::encode(&time_min),
        urlencoding::encode(&time_max),
    );

    let client = reqwest::blocking::Client::new();
    let list = client
        .get(&url)
        .bearer_auth(&token)
        .send()?
        .error_for_status()
        .map_err(|e| GoogleCalendarError::msg(format!("Calendar fetch failed: {}", e)))?
        .json::<GoogleEventsList>()?;

    let mut out = Vec::new();
    for item in list.items.unwrap_or_default() {
        let id = item.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let title = item
            .summary
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "Untitled meeting".to_string());
        let (start, end) = match (item.start.as_ref(), item.end.as_ref()) {
            (Some(s), Some(e)) => (s, e),
            _ => continue,
        };
        let starts_at = event_start_iso(start).unwrap_or_else(|| now.to_rfc3339());
        let meeting_url = pick_meeting_url(&item);
        let conference_type = meeting_url
            .as_deref()
            .and_then(classify_meeting_url)
            .or_else(|| {
                item.location
                    .as_deref()
                    .and_then(classify_meeting_url)
            });
        let attendees = item
            .attendees
            .unwrap_or_default()
            .into_iter()
            .filter_map(|a| a.email)
            .collect::<Vec<_>>()
            .join(", ");

        out.push(CalendarEvent {
            id: format!("google:{}", id),
            title,
            starts_at,
            duration_minutes: duration_minutes(start, end),
            attendees,
            meeting_url,
            conference_type,
            source: Some("google".to_string()),
        });
    }

    db.set_setting(GOOGLE_LAST_SYNC_KEY, &chrono::Utc::now().to_rfc3339())
        .map_err(|e| GoogleCalendarError::msg(e.to_string()))?;

    Ok(out)
}

pub fn merge_google_events(
    existing_json: &str,
    google_events: &[CalendarEvent],
) -> Result<String, GoogleCalendarError> {
    let existing: Vec<CalendarEvent> = serde_json::from_str(existing_json).unwrap_or_default();
    let local: Vec<CalendarEvent> = existing
        .into_iter()
        .filter(|e| e.source.as_deref() != Some("google"))
        .collect();
    let merged: Vec<CalendarEvent> = local.into_iter().chain(google_events.iter().cloned()).collect();
    serde_json::to_string(&merged).map_err(GoogleCalendarError::from)
}
