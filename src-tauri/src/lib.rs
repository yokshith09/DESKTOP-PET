//! Loaf desktop shell. Thin by design: windows, tray and OS integration live
//! here; logic lives in `loaf-core` (ADR-002).

pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Loaf");
}
