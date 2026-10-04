//! Tray menu and single-instance window management (F0-08).

use tauri::{tray::TrayIconBuilder, App, AppHandle, Manager, Runtime};

/// Register the tray icon.
/// Menu items are registered via the tray icon's click handler.
pub fn setup_tray<R: Runtime>(app: &mut App<R>) -> tauri::Result<()> {
    TrayIconBuilder::with_id("main").build(app)?;

    // TODO: Wire up tray click handlers for menu items
    // TODO: Show/hide menu based on platform (Windows vs macOS)

    Ok(())
}

/// Focus the main window; create it if missing.
pub fn show_or_create(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_focus()?;
        window.unminimize()?;
        window.show()?;
    }
    Ok(())
}

/// Hide the main window (do not close the app).
pub fn hide(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide()?;
    }
    Ok(())
}
