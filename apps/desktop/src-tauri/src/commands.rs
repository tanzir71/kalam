use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct OllamaModel {
    pub name: String,
    pub size: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct OllamaPullStatus {
    pub status: String,
    pub completed: Option<u64>,
    pub total: Option<u64>,
    pub done: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HistoryRow {
    pub id: String,
    pub original: String,
    pub rewritten: String,
    pub created_at: u64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SettingsPayload {
    pub backend: String,
    pub cloud_enabled: bool,
    pub provider: String,
    pub api_key: Option<String>,
}

#[tauri::command]
pub fn capture_selection() -> Result<String, String> {
    Ok(crate::capture::capture_selection_fallback())
}

#[tauri::command]
pub fn paste_text(text: String) -> Result<String, String> {
    Ok(crate::capture::paste_text_fallback(text))
}

#[tauri::command]
pub fn list_ollama_models() -> Result<Vec<OllamaModel>, String> {
    Ok(crate::ollama::list_ollama_models())
}

#[tauri::command]
pub fn pull_ollama_model(model: String) -> Result<OllamaPullStatus, String> {
    crate::ollama::pull_ollama_model(&model)
}

#[tauri::command]
pub fn grammar_deep_check(text: String) -> Result<Vec<String>, String> {
    let mut issues = Vec::new();
    if text.to_lowercase().contains("teh") {
        issues.push("Did you mean \"the\"?".to_string());
    }
    Ok(issues)
}

#[tauri::command]
pub fn run_humanize(text: String) -> Result<String, String> {
    Ok(text
        .replace("Moreover, ", "")
        .replace("Furthermore, ", "")
        .replace("it is important to note that ", ""))
}

#[tauri::command]
pub fn history_query() -> Result<Vec<HistoryRow>, String> {
    Ok(crate::store::history_query())
}

#[tauri::command]
pub fn history_add(row: HistoryRow) -> Result<Vec<HistoryRow>, String> {
    Ok(crate::store::history_add(row))
}

#[tauri::command]
pub fn settings_get() -> Result<SettingsPayload, String> {
    Ok(crate::store::settings_get())
}

#[tauri::command]
pub fn settings_set(payload: SettingsPayload) -> Result<SettingsPayload, String> {
    Ok(crate::store::settings_set(payload))
}
