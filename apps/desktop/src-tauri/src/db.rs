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
    pub manual_notes: String,
    pub ai_additions: String,
    pub instant_summary: String,
    pub tasks_json: String,
    pub template_id: String,
    pub audio_path: Option<String>,
    pub duration_ms: Option<i64>,
    pub deleted_at: Option<String>,
}

pub struct Database {
    conn: Mutex<Connection>,
    data_dir: PathBuf,
}

impl Database {
    pub fn open(data_dir: PathBuf) -> Result<Self, DbError> {
        std::fs::create_dir_all(&data_dir)?;
        std::fs::create_dir_all(data_dir.join("recordings"))?;
        let db_path = data_dir.join("notestack.db");
        if !db_path.exists() {
            let legacy_db = data_dir.join("record-plus.db");
            if legacy_db.is_file() {
                let _ = std::fs::rename(&legacy_db, &db_path);
            }
        }
        let conn = Connection::open(&db_path)?;
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
        migrate_transcripts_schema(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
            data_dir,
        })
    }

    pub fn recordings_dir(&self) -> PathBuf {
        self.data_dir.join("recordings")
    }

    pub fn list_transcripts(&self, include_deleted: bool) -> Result<Vec<Transcript>, DbError> {
        let conn = self.conn.lock().unwrap();
        let sql = if include_deleted {
            "SELECT id, title, created_at, updated_at, transcript_text, notes_text, manual_notes,
                    ai_additions, instant_summary, tasks_json, template_id, audio_path, duration_ms, deleted_at
             FROM transcripts ORDER BY created_at DESC"
        } else {
            "SELECT id, title, created_at, updated_at, transcript_text, notes_text, manual_notes,
                    ai_additions, instant_summary, tasks_json, template_id, audio_path, duration_ms, deleted_at
             FROM transcripts WHERE deleted_at IS NULL ORDER BY created_at DESC"
        };
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map([], |row| row_to_transcript(row))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    }

    pub fn get_transcript(&self, id: &str) -> Result<Option<Transcript>, DbError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, created_at, updated_at, transcript_text, notes_text, manual_notes,
                    ai_additions, instant_summary, tasks_json, template_id, audio_path, duration_ms, deleted_at
             FROM transcripts WHERE id = ?1",
        )?;
        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            return Ok(Some(row_to_transcript(row)?));
        }
        Ok(None)
    }

    pub fn insert_transcript(&self, transcript: &Transcript) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO transcripts (id, title, created_at, updated_at, transcript_text, notes_text,
             manual_notes, ai_additions, instant_summary, tasks_json, template_id, audio_path, duration_ms, deleted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                transcript.id,
                transcript.title,
                transcript.created_at,
                transcript.updated_at,
                transcript.transcript_text,
                transcript.notes_text,
                transcript.manual_notes,
                transcript.ai_additions,
                transcript.instant_summary,
                transcript.tasks_json,
                transcript.template_id,
                transcript.audio_path,
                transcript.duration_ms,
                transcript.deleted_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_transcript(&self, transcript: &Transcript) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE transcripts SET title = ?2, updated_at = ?3, transcript_text = ?4, notes_text = ?5,
             manual_notes = ?6, ai_additions = ?7, instant_summary = ?8, tasks_json = ?9, template_id = ?10,
             audio_path = ?11, duration_ms = ?12, deleted_at = ?13 WHERE id = ?1",
            params![
                transcript.id,
                transcript.title,
                transcript.updated_at,
                transcript.transcript_text,
                transcript.notes_text,
                transcript.manual_notes,
                transcript.ai_additions,
                transcript.instant_summary,
                transcript.tasks_json,
                transcript.template_id,
                transcript.audio_path,
                transcript.duration_ms,
                transcript.deleted_at,
            ],
        )?;
        Ok(())
    }

    pub fn soft_delete_transcript(&self, id: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE transcripts SET deleted_at = ?2, updated_at = ?2 WHERE id = ?1",
            params![id, now_iso()],
        )?;
        Ok(())
    }

    pub fn restore_transcript(&self, id: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE transcripts SET deleted_at = NULL, updated_at = ?2 WHERE id = ?1",
            params![id, now_iso()],
        )?;
        Ok(())
    }

    pub fn purge_transcript(&self, id: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM transcripts WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn search_transcripts(&self, query: &str) -> Result<Vec<Transcript>, DbError> {
        let q = query.trim();
        if q.is_empty() {
            return self.list_transcripts(false);
        }
        let like = format!("%{}%", q.replace('%', ""));
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, created_at, updated_at, transcript_text, notes_text, manual_notes,
                    ai_additions, instant_summary, tasks_json, template_id, audio_path, duration_ms, deleted_at
             FROM transcripts
             WHERE deleted_at IS NULL AND (
               title LIKE ?1 OR transcript_text LIKE ?1 OR notes_text LIKE ?1
               OR manual_notes LIKE ?1 OR ai_additions LIKE ?1 OR instant_summary LIKE ?1
             )
             ORDER BY created_at DESC",
        )?;
        let rows = stmt.query_map(params![like], |row| row_to_transcript(row))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
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

fn migrate_transcripts_schema(conn: &Connection) -> Result<(), DbError> {
    let columns: Vec<String> = conn
        .prepare("PRAGMA table_info(transcripts)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .collect();
    let mut add = |name: &str, ddl: &str| -> Result<(), DbError> {
        if !columns.iter().any(|c| c == name) {
            conn.execute_batch(ddl)?;
        }
        Ok(())
    };
    add("manual_notes", "ALTER TABLE transcripts ADD COLUMN manual_notes TEXT NOT NULL DEFAULT '';")?;
    add("ai_additions", "ALTER TABLE transcripts ADD COLUMN ai_additions TEXT NOT NULL DEFAULT '';")?;
    add(
        "instant_summary",
        "ALTER TABLE transcripts ADD COLUMN instant_summary TEXT NOT NULL DEFAULT '';",
    )?;
    add(
        "tasks_json",
        "ALTER TABLE transcripts ADD COLUMN tasks_json TEXT NOT NULL DEFAULT '[]';",
    )?;
    add(
        "template_id",
        "ALTER TABLE transcripts ADD COLUMN template_id TEXT NOT NULL DEFAULT 'general';",
    )?;
    add("deleted_at", "ALTER TABLE transcripts ADD COLUMN deleted_at TEXT;")?;
    Ok(())
}

fn row_to_transcript(row: &rusqlite::Row<'_>) -> Result<Transcript, rusqlite::Error> {
    Ok(Transcript {
        id: row.get(0)?,
        title: row.get(1)?,
        created_at: row.get(2)?,
        updated_at: row.get(3)?,
        transcript_text: row.get(4)?,
        notes_text: row.get(5)?,
        manual_notes: row.get(6)?,
        ai_additions: row.get(7)?,
        instant_summary: row.get(8)?,
        tasks_json: row.get(9)?,
        template_id: row.get(10)?,
        audio_path: row.get(11)?,
        duration_ms: row.get(12)?,
        deleted_at: row.get(13)?,
    })
}

pub fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

pub fn parse_iso(s: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(s)
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}
