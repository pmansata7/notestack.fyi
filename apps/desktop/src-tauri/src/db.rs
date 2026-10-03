use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("{0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("{0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transcript {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub transcript_text: String,
    pub notes_text: String,
    pub audio_path: Option<String>,
    pub duration_ms: Option<i64>,
}

pub struct Database {
    conn: Mutex<Connection>,
    data_dir: PathBuf,
}

impl Database {
    pub fn open(data_dir: PathBuf) -> Result<Self, DbError> {
        std::fs::create_dir_all(&data_dir)?;
        std::fs::create_dir_all(data_dir.join("recordings"))?;
        let db_path = data_dir.join("record-plus.db");
        let conn = Connection::open(db_path)?;
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS transcripts (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                transcript_text TEXT NOT NULL DEFAULT '',
                notes_text TEXT NOT NULL DEFAULT '',
                audio_path TEXT,
                duration_ms INTEGER
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );
            ",
        )?;
        Ok(Self {
            conn: Mutex::new(conn),
            data_dir,
        })
    }

    pub fn recordings_dir(&self) -> PathBuf {
        self.data_dir.join("recordings")
    }

    pub fn list_transcripts(&self) -> Result<Vec<Transcript>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, created_at, updated_at, transcript_text, notes_text, audio_path, duration_ms
             FROM transcripts ORDER BY created_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Transcript {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                transcript_text: row.get(4)?,
                notes_text: row.get(5)?,
                audio_path: row.get(6)?,
                duration_ms: row.get(7)?,
            })
        })?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    }

    pub fn get_transcript(&self, id: &str) -> Result<Option<Transcript>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, created_at, updated_at, transcript_text, notes_text, audio_path, duration_ms
             FROM transcripts WHERE id = ?1",
        )?;
        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            return Ok(Some(Transcript {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                transcript_text: row.get(4)?,
                notes_text: row.get(5)?,
                audio_path: row.get(6)?,
                duration_ms: row.get(7)?,
            }));
        }
        Ok(None)
    }

    pub fn insert_transcript(&self, transcript: &Transcript) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO transcripts (id, title, created_at, updated_at, transcript_text, notes_text, audio_path, duration_ms)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                transcript.id,
                transcript.title,
                transcript.created_at,
                transcript.updated_at,
                transcript.transcript_text,
                transcript.notes_text,
                transcript.audio_path,
                transcript.duration_ms,
            ],
        )?;
        Ok(())
    }

    pub fn update_transcript(&self, transcript: &Transcript) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE transcripts SET title = ?2, updated_at = ?3, transcript_text = ?4, notes_text = ?5,
             audio_path = ?6, duration_ms = ?7 WHERE id = ?1",
            params![
                transcript.id,
                transcript.title,
                transcript.updated_at,
                transcript.transcript_text,
                transcript.notes_text,
                transcript.audio_path,
                transcript.duration_ms,
            ],
        )?;
        Ok(())
    }

    pub fn delete_transcript(&self, id: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM transcripts WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            return Ok(Some(row.get(0)?));
        }
        Ok(None)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }
}

pub fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

pub fn parse_iso(s: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(s)
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}
