use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Runtime};

pub const TRAY_ID: &str = "kalam-tray";
pub const SHOW_ITEM_ID: &str = "show-kalam";
pub const HUD_ITEM_ID: &str = "open-capture-hud";
pub const QUIT_ITEM_ID: &str = "quit-kalam";
pub const OPEN_HUD_EVENT: &str = "kalam://open-hud";

pub fn tray_menu_items() -> [(&'static str, &'static str); 3] {
    [
        (SHOW_ITEM_ID, "Show Kalam"),
        (HUD_ITEM_ID, "Capture HUD"),
        (QUIT_ITEM_ID, "Quit Kalam"),
    ]
}

pub fn configure_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let [(show_id, show_label), (hud_id, hud_label), (quit_id, quit_label)] = tray_menu_items();
    let show = MenuItem::with_id(app, show_id, show_label, true, None::<&str>)?;
    let hud = MenuItem::with_id(app, hud_id, hud_label, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, quit_id, quit_label, true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &hud, &quit])?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("Kalam - local writing assistant")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| handle_menu_event(app, event.id().as_ref()));

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}

fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, item_id: &str) {
    match item_id {
        SHOW_ITEM_ID => show_main_window(app),
        HUD_ITEM_ID => {
            show_main_window(app);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit(OPEN_HUD_EVENT, ());
            }
        }
        QUIT_ITEM_ID => app.exit(0),
        _ => {}
    }
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tray_menu_contains_core_desktop_actions() {
        assert_eq!(
            tray_menu_items(),
            [
                ("show-kalam", "Show Kalam"),
                ("open-capture-hud", "Capture HUD"),
                ("quit-kalam", "Quit Kalam")
            ]
        );
    }
}
