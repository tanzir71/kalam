use std::path::PathBuf;
use std::process::Command;

const APP_NAME: &str = "Kalam";
const TEST_STARTUP_ENV: &str = "KALAM_TEST_STARTUP_FILE";

pub fn launch_at_login_enabled() -> bool {
    if let Some(path) = test_startup_path() {
        return std::fs::read_to_string(path)
            .map(|value| value.trim() == "enabled")
            .unwrap_or(false);
    }

    platform_launch_at_login_enabled()
}

pub fn set_launch_at_login(enabled: bool) -> Result<bool, String> {
    if let Some(path) = test_startup_path() {
        std::fs::write(path, if enabled { "enabled" } else { "disabled" }).map_err(|err| err.to_string())?;
        return Ok(enabled);
    }

    set_platform_launch_at_login(enabled)
}

fn test_startup_path() -> Option<PathBuf> {
    std::env::var_os(TEST_STARTUP_ENV).map(PathBuf::from)
}

#[cfg(target_os = "windows")]
fn platform_launch_at_login_enabled() -> bool {
    Command::new("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            "/v",
            APP_NAME,
        ])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

#[cfg(not(target_os = "windows"))]
fn platform_launch_at_login_enabled() -> bool {
    false
}

#[cfg(target_os = "windows")]
fn set_platform_launch_at_login(enabled: bool) -> Result<bool, String> {
    let status = if enabled {
        let exe = std::env::current_exe().map_err(|err| err.to_string())?;
        Command::new("reg")
            .args([
                "add",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                APP_NAME,
                "/t",
                "REG_SZ",
                "/d",
            ])
            .arg(format!("\"{}\"", exe.to_string_lossy()))
            .arg("/f")
            .status()
    } else {
        Command::new("reg")
            .args([
                "delete",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                APP_NAME,
                "/f",
            ])
            .status()
    }
    .map_err(|err| err.to_string())?;

    if status.success() {
        Ok(enabled)
    } else {
        Err("Unable to update Windows launch-at-login preference".to_string())
    }
}

#[cfg(not(target_os = "windows"))]
fn set_platform_launch_at_login(_enabled: bool) -> Result<bool, String> {
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn launch_at_login_uses_isolated_file_when_configured() {
        let path = std::env::temp_dir().join(format!(
            "kalam-startup-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock before epoch")
                .as_nanos()
        ));
        std::env::set_var(TEST_STARTUP_ENV, &path);

        assert!(!launch_at_login_enabled());
        assert_eq!(set_launch_at_login(true).expect("enable startup"), true);
        assert!(launch_at_login_enabled());
        assert_eq!(set_launch_at_login(false).expect("disable startup"), false);
        assert!(!launch_at_login_enabled());

        let _ = fs::remove_file(path);
        std::env::remove_var(TEST_STARTUP_ENV);
    }
}
