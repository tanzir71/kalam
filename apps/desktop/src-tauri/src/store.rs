use crate::commands::SettingsPayload;

pub fn settings_get() -> SettingsPayload {
    SettingsPayload {
        backend: "noai".to_string(),
        cloud_enabled: false,
        provider: "openai".to_string(),
        api_key: None,
    }
}

pub fn settings_set(mut payload: SettingsPayload) -> SettingsPayload {
    payload.api_key = payload.api_key.map(|_| "[stored-in-keychain]".to_string());
    payload
}
