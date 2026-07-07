use std::io::Write;
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

#[cfg(target_os = "windows")]
static LAST_TARGET_HWND: Mutex<Option<isize>> = Mutex::new(None);

pub fn capture_selection_fallback() -> String {
    if let Some(path) = test_clipboard_path() {
        return std::fs::read_to_string(path).unwrap_or_default();
    }

    remember_foreground_window();
    let _ = request_foreground_copy();
    std::thread::sleep(Duration::from_millis(120));
    read_clipboard().unwrap_or_default()
}

pub fn paste_text_fallback(text: String) -> String {
    if let Some(path) = test_clipboard_path() {
        let _ = std::fs::write(path, &text);
        return text;
    }

    let _ = write_clipboard(&text);
    let _ = request_last_target_paste();
    text
}

fn test_clipboard_path() -> Option<std::path::PathBuf> {
    std::env::var_os("KALAM_TEST_CLIPBOARD_FILE").map(std::path::PathBuf::from)
}

fn read_clipboard() -> Option<String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", "Get-Clipboard -Raw"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let raw = String::from_utf8(output.stdout).ok()?;
    Some(raw.trim_end_matches(['\r', '\n']).to_string())
}

#[cfg(target_os = "windows")]
fn request_foreground_copy() -> Option<()> {
    send_keys("^c")
}

#[cfg(not(target_os = "windows"))]
fn request_foreground_copy() -> Option<()> {
    None
}

#[cfg(target_os = "windows")]
fn request_last_target_paste() -> Option<()> {
    focus_last_target_window()?;
    std::thread::sleep(Duration::from_millis(120));
    send_keys("^v")
}

#[cfg(not(target_os = "windows"))]
fn request_last_target_paste() -> Option<()> {
    None
}

#[cfg(target_os = "windows")]
fn send_keys(keys: &str) -> Option<()> {
    let status = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{}')", keys),
        ])
        .status()
        .ok()?;
    status.success().then_some(())
}

#[cfg(target_os = "windows")]
fn remember_foreground_window() {
    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.is_null() {
        return;
    }
    if let Ok(mut target) = LAST_TARGET_HWND.lock() {
        *target = Some(hwnd as isize);
    }
}

#[cfg(not(target_os = "windows"))]
fn remember_foreground_window() {}

#[cfg(target_os = "windows")]
fn focus_last_target_window() -> Option<()> {
    let hwnd = LAST_TARGET_HWND.lock().ok().and_then(|target| *target)?;
    let result = unsafe { SetForegroundWindow(hwnd as *mut std::ffi::c_void) };
    (result != 0).then_some(())
}

fn write_clipboard(text: &str) -> Option<()> {
    let mut child = Command::new("powershell")
        .args(["-NoProfile", "-Command", "$input | Set-Clipboard"])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    child.stdin.as_mut()?.write_all(text.as_bytes()).ok()?;
    let status = child.wait().ok()?;
    status.success().then_some(())
}

#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> *mut std::ffi::c_void;
    fn SetForegroundWindow(hwnd: *mut std::ffi::c_void) -> i32;
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn paste_and_capture_use_isolated_clipboard_file_when_configured() {
        let path = std::env::temp_dir().join(format!(
            "kalam-clipboard-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock before epoch")
                .as_nanos()
        ));
        std::env::set_var("KALAM_TEST_CLIPBOARD_FILE", &path);

        assert_eq!(paste_text_fallback("Captured text".to_string()), "Captured text");
        assert_eq!(capture_selection_fallback(), "Captured text");

        let _ = fs::remove_file(path);
        std::env::remove_var("KALAM_TEST_CLIPBOARD_FILE");
    }
}
