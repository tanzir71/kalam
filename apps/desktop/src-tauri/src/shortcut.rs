use tauri::{AppHandle, Emitter, Manager, Runtime};

#[cfg(test)]
pub const CAPTURE_SHORTCUT_LABEL: &str = "Ctrl+Alt+K";

#[cfg(test)]
pub fn capture_shortcut_label() -> &'static str {
    CAPTURE_SHORTCUT_LABEL
}

pub fn register_capture_shortcut<R: Runtime>(app: &AppHandle<R>) {
    register_platform_capture_shortcut(app);
}

#[derive(Clone, serde::Serialize)]
struct CaptureShortcutPayload {
    text: String,
}

#[cfg(target_os = "windows")]
fn register_platform_capture_shortcut<R: Runtime>(app: &AppHandle<R>) {
    let app = app.clone();
    std::thread::spawn(move || unsafe {
        if RegisterHotKey(std::ptr::null_mut(), HOTKEY_ID, MOD_CONTROL | MOD_ALT, VK_K) == 0 {
            return;
        }

        let mut msg = std::mem::zeroed::<MSG>();
        while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
            if msg.message == WM_HOTKEY && msg.w_param == HOTKEY_ID as usize {
                let captured = crate::capture::capture_selection_fallback();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit(crate::tray::OPEN_HUD_EVENT, CaptureShortcutPayload { text: captured });
                }
            }
        }

        let _ = UnregisterHotKey(std::ptr::null_mut(), HOTKEY_ID);
    });
}

#[cfg(not(target_os = "windows"))]
fn register_platform_capture_shortcut<R: Runtime>(_app: &AppHandle<R>) {}

#[cfg(target_os = "windows")]
const HOTKEY_ID: i32 = 0x4b11;
#[cfg(target_os = "windows")]
const MOD_ALT: u32 = 0x0001;
#[cfg(target_os = "windows")]
const MOD_CONTROL: u32 = 0x0002;
#[cfg(target_os = "windows")]
const VK_K: u32 = 0x4b;
#[cfg(target_os = "windows")]
const WM_HOTKEY: u32 = 0x0312;

#[cfg(target_os = "windows")]
#[repr(C)]
struct POINT {
    x: i32,
    y: i32,
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct MSG {
    hwnd: *mut std::ffi::c_void,
    message: u32,
    w_param: usize,
    l_param: isize,
    time: u32,
    pt: POINT,
}

#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn RegisterHotKey(hwnd: *mut std::ffi::c_void, id: i32, fs_modifiers: u32, vk: u32) -> i32;
    fn UnregisterHotKey(hwnd: *mut std::ffi::c_void, id: i32) -> i32;
    fn GetMessageW(msg: *mut MSG, hwnd: *mut std::ffi::c_void, min: u32, max: u32) -> i32;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capture_shortcut_label_is_stable_for_docs_and_ui() {
        assert_eq!(capture_shortcut_label(), "Ctrl+Alt+K");
    }
}
