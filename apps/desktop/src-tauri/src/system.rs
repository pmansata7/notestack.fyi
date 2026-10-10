use serde::Serialize;
use sysinfo::{Disks, System};

#[derive(Debug, Clone, Serialize)]
pub struct ForegroundMeeting {
    pub kind: String,
    pub label: String,
}

fn classify_meeting_text(text: &str) -> Option<(String, String)> {
    let lower = text.to_lowercase();
    if lower.contains("zoom") || lower.contains("zoom.us") {
        return Some(("zoom".to_string(), "Zoom".to_string()));
    }
    if lower.contains("microsoft teams") || lower.contains("teams.microsoft") || lower == "teams" {
        return Some(("teams".to_string(), "Microsoft Teams".to_string()));
    }
    if lower.contains("google meet") || lower.contains("meet.google") {
        return Some(("meet".to_string(), "Google Meet".to_string()));
    }
    if lower.contains("webex") {
        return Some(("webex".to_string(), "Webex".to_string()));
    }
    None
}

fn run_command_output(args: &[&str]) -> Option<String> {
    let out = std::process::Command::new(args[0])
        .args(&args[1..])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

/// Best-effort detection of Zoom / Teams / Meet from the foreground app or window title.
pub fn detect_foreground_meeting() -> Option<ForegroundMeeting> {
    #[cfg(target_os = "macos")]
    {
        let app = run_command_output(&[
            "osascript",
            "-e",
            "tell application \"System Events\" to get name of first application process whose frontmost is true",
        ]);
        let window = run_command_output(&[
            "osascript",
            "-e",
            "tell application \"System Events\" to tell (first application process whose frontmost is true) to get name of front window",
        ]);
        for text in [window, app].into_iter().flatten() {
            if let Some((kind, label)) = classify_meeting_text(&text) {
                return Some(ForegroundMeeting { kind, label });
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(title) = run_command_output(&["xdotool", "getactivewindow", "getwindowname"]) {
            if let Some((kind, label)) = classify_meeting_text(&title) {
                return Some(ForegroundMeeting { kind, label });
            }
        }
        if let Some(class) = run_command_output(&["xdotool", "getactivewindow", "getwindowclassname"]) {
            if let Some((kind, label)) = classify_meeting_text(&class) {
                return Some(ForegroundMeeting { kind, label });
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(title) = run_command_output(&[
            "powershell",
            "-NoProfile",
            "-Command",
            "(Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Sort-Object -Property @{Expression={$_.MainWindowTitle.Length}; Descending=$true} | Select-Object -First 1).MainWindowTitle",
        ]) {
            if let Some((kind, label)) = classify_meeting_text(&title) {
                return Some(ForegroundMeeting { kind, label });
            }
        }
    }

    None
}

#[derive(Debug, Clone, Serialize)]
pub struct HardwareHints {
    /// Free space on the volume that holds the user home directory (where Ollama stores models).
    pub available_disk_bytes: u64,
    pub total_memory_bytes: u64,
    pub available_memory_bytes: u64,
}

pub fn hardware_hints() -> HardwareHints {
    let available_disk_bytes = home_volume_available_bytes();
    let mut sys = System::new_all();
    sys.refresh_memory();
    HardwareHints {
        available_disk_bytes,
        total_memory_bytes: sys.total_memory(),
        available_memory_bytes: sys.available_memory(),
    }
}

fn home_volume_available_bytes() -> u64 {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    let home_path = std::path::Path::new(&home);

    let disks = Disks::new_with_refreshed_list();
    let mut best_match: Option<(usize, u64)> = None;

    for disk in disks.list() {
        let mount = disk.mount_point();
        if home_path.starts_with(mount) {
            let len = mount.as_os_str().len();
            if best_match.map(|(l, _)| len > l).unwrap_or(true) {
                best_match = Some((len, disk.available_space()));
            }
        }
    }

    if let Some((_, bytes)) = best_match {
        return bytes;
    }

    disks
        .list()
        .iter()
        .map(|d| d.available_space())
        .max()
        .unwrap_or(0)
}
