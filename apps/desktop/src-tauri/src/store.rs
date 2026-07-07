use crate::commands::{HistoryRow, SettingsPayload};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

const DEFAULT_KEYCHAIN_TARGET: &str = "app.kalam.desktop/cloud-api-key";
const KEYCHAIN_USER: &str = "kalam-cloud-provider";
const REDACTED_SECRET: &str = "[stored-in-keychain]";
const LEGACY_REDACTED_SECRET: &str = "[stored-outside-settings]";

#[derive(Debug, Deserialize, Serialize)]
struct StoredSettings {
    backend: String,
    cloud_enabled: bool,
    provider: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct StoredSecret {
    api_key: String,
}

pub fn settings_get() -> SettingsPayload {
    let stored = read_json(settings_path()).unwrap_or_else(default_stored_settings);
    SettingsPayload {
        backend: stored.backend,
        cloud_enabled: stored.cloud_enabled,
        provider: stored.provider,
        api_key: read_secret().map(|_| REDACTED_SECRET.to_string()),
    }
}

pub fn settings_set(payload: SettingsPayload) -> SettingsPayload {
    let stored = StoredSettings {
        backend: payload.backend,
        cloud_enabled: payload.cloud_enabled,
        provider: payload.provider,
    };
    let _ = write_json(settings_path(), &stored);

    match payload.api_key.as_deref() {
        Some("") => {
            delete_secret();
        }
        Some(REDACTED_SECRET) | Some(LEGACY_REDACTED_SECRET) | None => {}
        Some(api_key) => {
            let _ = write_secret(api_key);
        }
    }

    settings_get()
}

pub fn history_query() -> Vec<HistoryRow> {
    history_query_sqlite().unwrap_or_else(|| read_json(history_json_path()).unwrap_or_default())
}

pub fn history_add(row: HistoryRow) -> Vec<HistoryRow> {
    if history_add_sqlite(&row).is_some() {
        return history_query_sqlite().unwrap_or_default();
    }

    let mut history = history_query();
    history.retain(|item| item.id != row.id);
    history.insert(0, row);
    history.truncate(100);
    let _ = write_json(history_json_path(), &history);
    history
}

fn default_stored_settings() -> StoredSettings {
    StoredSettings {
        backend: "noai".to_string(),
        cloud_enabled: false,
        provider: "openai".to_string(),
    }
}

fn read_secret() -> Option<String> {
    read_keychain_secret().or_else(|| read_json::<StoredSecret>(secret_path()).map(|secret| secret.api_key))
}

fn write_secret(api_key: &str) -> std::io::Result<()> {
    if write_keychain_secret(api_key).is_some() {
        let _ = fs::remove_file(secret_path());
        return Ok(());
    }

    write_json(
        secret_path(),
        &StoredSecret {
            api_key: api_key.to_string(),
        },
    )
}

fn delete_secret() {
    let _ = delete_keychain_secret();
    let _ = fs::remove_file(secret_path());
}

fn keychain_target() -> String {
    std::env::var("KALAM_KEYCHAIN_TARGET").unwrap_or_else(|_| DEFAULT_KEYCHAIN_TARGET.to_string())
}

fn read_keychain_secret() -> Option<String> {
    platform_keychain_read(&keychain_target())
}

fn write_keychain_secret(api_key: &str) -> Option<()> {
    platform_keychain_write(&keychain_target(), KEYCHAIN_USER, api_key)
}

fn delete_keychain_secret() -> Option<()> {
    platform_keychain_delete(&keychain_target())
}

fn settings_path() -> PathBuf {
    data_dir().join("settings.json")
}

fn secret_path() -> PathBuf {
    data_dir().join("secrets.local.json")
}

fn history_json_path() -> PathBuf {
    data_dir().join("history.json")
}

fn history_sqlite_path() -> PathBuf {
    data_dir().join("history.sqlite3")
}

fn history_add_sqlite(row: &HistoryRow) -> Option<()> {
    let sql = format!(
        "{schema}
         INSERT INTO history (id, original, rewritten, created_at)
         VALUES ({id}, {original}, {rewritten}, {created_at})
         ON CONFLICT(id) DO UPDATE SET
           original=excluded.original,
           rewritten=excluded.rewritten,
           created_at=excluded.created_at;",
        schema = history_schema_sql(),
        id = sql_string(&row.id),
        original = sql_string(&row.original),
        rewritten = sql_string(&row.rewritten),
        created_at = row.created_at
    );
    run_sqlite(&sql).map(|_| ())
}

fn history_query_sqlite() -> Option<Vec<HistoryRow>> {
    let sql = format!(
        "{schema}
         SELECT id, original, rewritten, created_at
         FROM history
         ORDER BY created_at DESC
         LIMIT 100;",
        schema = history_schema_sql()
    );
    let raw = run_sqlite(&sql)?;
    serde_json::from_str(&raw).ok()
}

fn run_sqlite(sql: &str) -> Option<String> {
    let path = history_sqlite_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).ok()?;
    }
    let output = Command::new("sqlite3")
        .arg("-json")
        .arg(path)
        .arg(sql)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout).ok()
}

fn history_schema_sql() -> &'static str {
    "CREATE TABLE IF NOT EXISTS history (
       id TEXT PRIMARY KEY NOT NULL,
       original TEXT NOT NULL,
       rewritten TEXT NOT NULL,
       created_at INTEGER NOT NULL
     );"
}

fn sql_string(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

fn data_dir() -> PathBuf {
    if let Some(path) = std::env::var_os("KALAM_DATA_DIR") {
        return PathBuf::from(path);
    }
    if let Some(path) = std::env::var_os("APPDATA") {
        return PathBuf::from(path).join("Kalam");
    }
    if let Some(path) = std::env::var_os("XDG_DATA_HOME") {
        return PathBuf::from(path).join("kalam");
    }
    if let Some(path) = std::env::var_os("HOME") {
        return PathBuf::from(path).join(".kalam");
    }
    std::env::temp_dir().join("kalam")
}

fn read_json<T>(path: PathBuf) -> Option<T>
where
    T: for<'de> Deserialize<'de>,
{
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

fn write_json<T>(path: PathBuf, value: &T) -> std::io::Result<()>
where
    T: Serialize,
{
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let raw = serde_json::to_string_pretty(value)?;
    fs::write(path, raw)
}

#[cfg(not(windows))]
fn platform_keychain_read(_target: &str) -> Option<String> {
    None
}

#[cfg(not(windows))]
fn platform_keychain_write(_target: &str, _user: &str, _secret: &str) -> Option<()> {
    None
}

#[cfg(not(windows))]
fn platform_keychain_delete(_target: &str) -> Option<()> {
    None
}

#[cfg(windows)]
fn platform_keychain_read(target: &str) -> Option<String> {
    windows_keychain::read(target)
}

#[cfg(windows)]
fn platform_keychain_write(target: &str, user: &str, secret: &str) -> Option<()> {
    windows_keychain::write(target, user, secret)
}

#[cfg(windows)]
fn platform_keychain_delete(target: &str) -> Option<()> {
    windows_keychain::delete(target)
}

#[cfg(windows)]
mod windows_keychain {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::null_mut;

    const CRED_TYPE_GENERIC: u32 = 1;
    const CRED_PERSIST_LOCAL_MACHINE: u32 = 2;

    #[repr(C)]
    struct FileTime {
        low_date_time: u32,
        high_date_time: u32,
    }

    #[repr(C)]
    struct CredentialW {
        flags: u32,
        credential_type: u32,
        target_name: *mut u16,
        comment: *mut u16,
        last_written: FileTime,
        credential_blob_size: u32,
        credential_blob: *mut u8,
        persist: u32,
        attribute_count: u32,
        attributes: *mut core::ffi::c_void,
        target_alias: *mut u16,
        user_name: *mut u16,
    }

    #[link(name = "Advapi32")]
    extern "system" {
        fn CredWriteW(credential: *const CredentialW, flags: u32) -> i32;
        fn CredReadW(
            target_name: *const u16,
            credential_type: u32,
            flags: u32,
            credential: *mut *mut CredentialW,
        ) -> i32;
        fn CredDeleteW(target_name: *const u16, credential_type: u32, flags: u32) -> i32;
        fn CredFree(buffer: *mut core::ffi::c_void);
    }

    pub fn read(target: &str) -> Option<String> {
        let target_wide = wide(target);
        let mut credential: *mut CredentialW = null_mut();
        let ok = unsafe { CredReadW(target_wide.as_ptr(), CRED_TYPE_GENERIC, 0, &mut credential) };
        if ok == 0 || credential.is_null() {
            return None;
        }

        let result = unsafe {
            let credential_ref = &*credential;
            if credential_ref.credential_blob.is_null() {
                Some(String::new())
            } else {
                let bytes = std::slice::from_raw_parts(
                    credential_ref.credential_blob,
                    credential_ref.credential_blob_size as usize,
                );
                String::from_utf8(bytes.to_vec()).ok()
            }
        };
        unsafe {
            CredFree(credential as *mut core::ffi::c_void);
        }
        result
    }

    pub fn write(target: &str, user: &str, secret: &str) -> Option<()> {
        let target_wide = wide(target);
        let user_wide = wide(user);
        let mut secret_bytes = secret.as_bytes().to_vec();
        let blob_size = u32::try_from(secret_bytes.len()).ok()?;
        let credential = CredentialW {
            flags: 0,
            credential_type: CRED_TYPE_GENERIC,
            target_name: target_wide.as_ptr() as *mut u16,
            comment: null_mut(),
            last_written: FileTime {
                low_date_time: 0,
                high_date_time: 0,
            },
            credential_blob_size: blob_size,
            credential_blob: secret_bytes.as_mut_ptr(),
            persist: CRED_PERSIST_LOCAL_MACHINE,
            attribute_count: 0,
            attributes: null_mut(),
            target_alias: null_mut(),
            user_name: user_wide.as_ptr() as *mut u16,
        };
        let ok = unsafe { CredWriteW(&credential, 0) };
        (ok != 0).then_some(())
    }

    pub fn delete(target: &str) -> Option<()> {
        let target_wide = wide(target);
        let ok = unsafe { CredDeleteW(target_wide.as_ptr(), CRED_TYPE_GENERIC, 0) };
        (ok != 0).then_some(())
    }

    fn wide(value: &str) -> Vec<u16> {
        OsStr::new(value).encode_wide().chain([0]).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::Mutex;
    use std::time::{SystemTime, UNIX_EPOCH};

    static TEST_ENV_LOCK: Mutex<()> = Mutex::new(());

    #[test]
    fn settings_roundtrip_persists_without_writing_secret_to_settings_file() {
        with_test_data_dir(|dir| {
            let saved = settings_set(SettingsPayload {
                backend: "cloud".to_string(),
                cloud_enabled: true,
                provider: "anthropic".to_string(),
                api_key: Some("sk-local-test".to_string()),
            });

            assert_eq!(saved.backend, "cloud");
            assert_eq!(saved.cloud_enabled, true);
            assert_eq!(saved.provider, "anthropic");
            assert_eq!(saved.api_key.as_deref(), Some(REDACTED_SECRET));

            let loaded = settings_get();
            assert_eq!(loaded.backend, "cloud");
            assert_eq!(loaded.cloud_enabled, true);
            assert_eq!(loaded.provider, "anthropic");
            assert_eq!(loaded.api_key.as_deref(), Some(REDACTED_SECRET));

            let settings_file = fs::read_to_string(dir.join("settings.json")).expect("settings file exists");
            assert!(!settings_file.contains("sk-local-test"));
            if cfg!(windows) {
                assert!(!dir.join("secrets.local.json").exists());
            }
        });
    }

    #[test]
    fn history_add_persists_latest_items_first() {
        with_test_data_dir(|dir| {
            let first = HistoryRow {
                id: "one".to_string(),
                original: "Original".to_string(),
                rewritten: "Rewritten".to_string(),
                created_at: 10,
            };
            let second = HistoryRow {
                id: "two".to_string(),
                original: "Original 2".to_string(),
                rewritten: "Rewritten 2".to_string(),
                created_at: 20,
            };

            history_add(first);
            let history = history_add(second);
            let loaded = history_query();

            assert_eq!(history.len(), 2);
            assert_eq!(history[0].id, "two");
            assert_eq!(loaded[0].rewritten, "Rewritten 2");
            assert_eq!(loaded[1].rewritten, "Rewritten");
            assert!(dir.join("history.sqlite3").exists());
            assert!(!dir.join("history.json").exists());
        });
    }

    fn with_test_data_dir(run: impl FnOnce(PathBuf)) {
        let _guard = TEST_ENV_LOCK
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let dir = std::env::temp_dir().join(format!(
            "kalam-store-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock before epoch")
                .as_nanos()
        ));
        let keychain_target = format!("app.kalam.desktop/test-{}", dir.file_name().unwrap().to_string_lossy());
        std::env::set_var("KALAM_DATA_DIR", &dir);
        std::env::set_var("KALAM_KEYCHAIN_TARGET", &keychain_target);

        run(dir.clone());

        delete_secret();
        let _ = fs::remove_dir_all(dir);
        std::env::remove_var("KALAM_KEYCHAIN_TARGET");
        std::env::remove_var("KALAM_DATA_DIR");
    }
}
