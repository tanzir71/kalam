use crate::commands::{HistoryRow, SettingsPayload};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const REDACTED_SECRET: &str = "[stored-outside-settings]";
const LEGACY_REDACTED_SECRET: &str = "[stored-in-keychain]";

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
            let _ = fs::remove_file(secret_path());
        }
        Some(REDACTED_SECRET) | Some(LEGACY_REDACTED_SECRET) | None => {}
        Some(api_key) => {
            let _ = write_secret(api_key);
        }
    }

    settings_get()
}

pub fn history_query() -> Vec<HistoryRow> {
    read_json(history_path()).unwrap_or_default()
}

pub fn history_add(row: HistoryRow) -> Vec<HistoryRow> {
    let mut history = history_query();
    history.retain(|item| item.id != row.id);
    history.insert(0, row);
    history.truncate(100);
    let _ = write_json(history_path(), &history);
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
    read_json::<StoredSecret>(secret_path()).map(|secret| secret.api_key)
}

fn write_secret(api_key: &str) -> std::io::Result<()> {
    write_json(
        secret_path(),
        &StoredSecret {
            api_key: api_key.to_string(),
        },
    )
}

fn settings_path() -> PathBuf {
    data_dir().join("settings.json")
}

fn secret_path() -> PathBuf {
    data_dir().join("secrets.local.json")
}

fn history_path() -> PathBuf {
    data_dir().join("history.json")
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
        });
    }

    #[test]
    fn history_add_persists_latest_items_first() {
        with_test_data_dir(|_dir| {
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
        });
    }

    fn with_test_data_dir(run: impl FnOnce(PathBuf)) {
        let _guard = TEST_ENV_LOCK.lock().expect("test env lock");
        let dir = std::env::temp_dir().join(format!(
            "kalam-store-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock before epoch")
                .as_nanos()
        ));
        std::env::set_var("KALAM_DATA_DIR", &dir);

        run(dir.clone());

        let _ = fs::remove_dir_all(dir);
        std::env::remove_var("KALAM_DATA_DIR");
    }
}
