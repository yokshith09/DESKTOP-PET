//! Single-instance enforcement: only one Loaf process at a time (F0-08, R0-01).
//!
//! Uses a lock file to detect if another instance is running.
//! If so, sends a signal and exits; if not, acquires the lock.

use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};

/// The lock file path (in app cache directory).
fn lock_file_path(app_data: &Path) -> PathBuf {
    app_data.join("loaf.lock")
}

/// Check if another instance is running; if so, signal it and return false.
/// If not, create the lock file and return true (we are the primary instance).
pub fn acquire_lock(app_data: &Path) -> io::Result<bool> {
    let lock_path = lock_file_path(app_data);

    // Try to read the lock file to see if another instance exists.
    if let Ok(contents) = fs::read_to_string(&lock_path) {
        if let Ok(pid_str) = contents.trim().parse::<u32>() {
            // Check if the process still exists (platform-specific).
            if process_exists(pid_str) {
                // Another instance is running. TODO: signal it to show window.
                return Ok(false);
            }
        }
    }

    // No running instance found; create the lock file with our PID.
    let our_pid = std::process::id();
    fs::write(&lock_path, our_pid.to_string())?;
    Ok(true)
}

/// Clean up the lock file on shutdown.
pub fn release_lock(app_data: &Path) -> io::Result<()> {
    let lock_path = lock_file_path(app_data);
    let _ = fs::remove_file(lock_path);
    Ok(())
}

/// Check if a process with the given PID exists.
#[cfg(windows)]
fn process_exists(pid: u32) -> bool {
    use std::os::windows::raw::c_void;
    unsafe {
        let handle = winapi::um::processthreadsapi::OpenProcess(
            winapi::um::winnt::PROCESS_QUERY_LIMITED_INFORMATION,
            false as i32,
            pid,
        );
        if handle.is_null() {
            return false;
        }
        let close_result = winapi::um::handleapi::CloseHandle(handle);
        close_result != 0
    }
}

#[cfg(unix)]
fn process_exists(pid: u32) -> bool {
    // On Unix, check if /proc/pid exists (Linux) or use kill with signal 0 (macOS).
    #[cfg(target_os = "linux")]
    {
        Path::new(&format!("/proc/{}", pid)).exists()
    }
    #[cfg(target_os = "macos")]
    {
        unsafe { libc::kill(pid as i32, 0) == 0 }
    }
}

#[cfg(not(any(windows, unix)))]
fn process_exists(_pid: u32) -> bool {
    // On other platforms, assume process doesn't exist (safe default).
    false
}
