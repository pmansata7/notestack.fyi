mod commands;
mod db;
mod ollama;
mod state;

use state::{app_data_dir, AppState};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let data_dir = app_data_dir();
    let database = db::Database::open(data_dir).expect("failed to open database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(AppState { db: database }))
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::get_data_dir,
            commands::list_transcripts,
            commands::search_transcripts,
            commands::get_transcript,
            commands::create_transcript,
            commands::update_transcript,
            commands::delete_transcript,
            commands::restore_transcript,
            commands::purge_transcript,
            commands::save_recording_audio,
            commands::enhance_notes_for_transcript,
            commands::generate_instant_summary,
            commands::ask_across_meetings,
            commands::generate_daily_digest,
            commands::generate_meeting_prep,
            commands::run_live_skill,
            commands::strip_audio_after_transcribe,
            commands::ollama_check_connection,
            commands::ollama_list_models,
            commands::ollama_pull_model,
            commands::ollama_test_model,
            commands::generate_notes_from_transcript,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
