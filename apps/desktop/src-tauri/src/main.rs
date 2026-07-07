mod capture;
mod commands;
mod ollama;
mod startup;
mod store;
mod tray;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            tray::configure_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::capture_selection,
            commands::paste_text,
            commands::launch_at_login_get,
            commands::launch_at_login_set,
            commands::list_ollama_models,
            commands::pull_ollama_model,
            commands::grammar_deep_check,
            commands::run_humanize,
            commands::history_query,
            commands::history_add,
            commands::settings_get,
            commands::settings_set
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kalam desktop");
}
