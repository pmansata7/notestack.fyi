use serde::Serialize;
use sysinfo::{Disks, System};

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
