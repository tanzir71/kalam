use crate::commands::{OllamaModel, OllamaPullStatus};
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;

pub fn list_ollama_models() -> Vec<OllamaModel> {
    query_ollama_tags()
        .ok()
        .and_then(|body| parse_ollama_tags(&body).ok())
        .unwrap_or_default()
}

pub fn pull_ollama_model(model: &str) -> Result<OllamaPullStatus, String> {
    let body = query_ollama_pull(model)?;
    parse_ollama_pull_stream(&body)
}

fn query_ollama_tags() -> Result<String, String> {
    let address: SocketAddr = "127.0.0.1:11434"
        .parse()
        .map_err(|error| format!("invalid Ollama address: {error}"))?;
    let mut stream = TcpStream::connect_timeout(&address, Duration::from_millis(500))
        .map_err(|error| format!("Ollama unavailable: {error}"))?;
    let _ = stream.set_read_timeout(Some(Duration::from_millis(1500)));
    let _ = stream.set_write_timeout(Some(Duration::from_millis(500)));

    stream
        .write_all(b"GET /api/tags HTTP/1.1\r\nHost: 127.0.0.1:11434\r\nConnection: close\r\n\r\n")
        .map_err(|error| format!("Ollama request failed: {error}"))?;

    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .map_err(|error| format!("Ollama response failed: {error}"))?;

    if !response.starts_with("HTTP/1.1 200") && !response.starts_with("HTTP/1.0 200") {
        return Err("Ollama returned a non-200 response".to_string());
    }

    Ok(http_body(response))
}

fn query_ollama_pull(model: &str) -> Result<String, String> {
    #[derive(Serialize)]
    struct PullRequest<'a> {
        model: &'a str,
        stream: bool,
    }

    let request_body = serde_json::to_string(&PullRequest {
        model,
        stream: true,
    })
    .map_err(|error| format!("invalid pull request: {error}"))?;
    let address: SocketAddr = "127.0.0.1:11434"
        .parse()
        .map_err(|error| format!("invalid Ollama address: {error}"))?;
    let mut stream = TcpStream::connect_timeout(&address, Duration::from_millis(500))
        .map_err(|error| format!("Ollama unavailable: {error}"))?;
    let _ = stream.set_read_timeout(Some(Duration::from_secs(60)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));

    let request = format!(
        "POST /api/pull HTTP/1.1\r\nHost: 127.0.0.1:11434\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        request_body.len(),
        request_body
    );
    stream
        .write_all(request.as_bytes())
        .map_err(|error| format!("Ollama pull request failed: {error}"))?;

    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .map_err(|error| format!("Ollama pull response failed: {error}"))?;

    if !response.starts_with("HTTP/1.1 200") && !response.starts_with("HTTP/1.0 200") {
        return Err("Ollama returned a non-200 pull response".to_string());
    }

    Ok(http_body(response))
}

fn parse_ollama_tags(raw: &str) -> Result<Vec<OllamaModel>, serde_json::Error> {
    #[derive(Deserialize)]
    struct TagsResponse {
        models: Vec<TagModel>,
    }

    #[derive(Deserialize)]
    struct TagModel {
        name: String,
        size: Option<u64>,
    }

    let parsed: TagsResponse = serde_json::from_str(raw)?;
    Ok(parsed
        .models
        .into_iter()
        .map(|model| OllamaModel {
            name: model.name,
            size: model.size,
        })
        .collect())
}

fn parse_ollama_pull_stream(raw: &str) -> Result<OllamaPullStatus, String> {
    #[derive(Deserialize)]
    struct PullLine {
        status: Option<String>,
        completed: Option<u64>,
        total: Option<u64>,
        error: Option<String>,
    }

    let mut latest = OllamaPullStatus {
        status: "starting".to_string(),
        completed: None,
        total: None,
        done: false,
    };
    let mut saw_line = false;

    for line in raw.lines().map(str::trim).filter(|line| !line.is_empty()) {
        saw_line = true;
        let parsed: PullLine = serde_json::from_str(line)
            .map_err(|error| format!("invalid Ollama pull progress: {error}"))?;
        if let Some(error) = parsed.error {
            return Err(error);
        }
        if let Some(status) = parsed.status {
            latest.done = status.eq_ignore_ascii_case("success");
            latest.status = status;
        }
        if parsed.completed.is_some() {
            latest.completed = parsed.completed;
        }
        if parsed.total.is_some() {
            latest.total = parsed.total;
        }
    }

    if saw_line {
        Ok(latest)
    } else {
        Err("Ollama returned no pull progress".to_string())
    }
}

fn http_body(response: String) -> String {
    response
        .split_once("\r\n\r\n")
        .map(|(_, body)| body.to_string())
        .unwrap_or(response)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_ollama_tags_response() {
        let models = parse_ollama_tags(
            r#"{
              "models": [
                { "name": "llama3.1:8b", "size": 4661224676 },
                { "name": "qwen2.5:7b" }
              ]
            }"#,
        )
        .expect("valid Ollama tags payload");

        assert_eq!(models.len(), 2);
        assert_eq!(models[0].name, "llama3.1:8b");
        assert_eq!(models[0].size, Some(4661224676));
        assert_eq!(models[1].name, "qwen2.5:7b");
        assert_eq!(models[1].size, None);
    }

    #[test]
    fn parses_ollama_pull_progress_stream() {
        let status = parse_ollama_pull_stream(
            r#"{"status":"pulling manifest"}
{"status":"downloading","completed":128,"total":256}
{"status":"success"}"#,
        )
        .expect("valid Ollama pull stream");

        assert_eq!(status.status, "success");
        assert_eq!(status.completed, Some(128));
        assert_eq!(status.total, Some(256));
        assert!(status.done);
    }
}
