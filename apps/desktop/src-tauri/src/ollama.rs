use crate::commands::OllamaModel;
use serde::Deserialize;
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;

pub fn list_ollama_models() -> Vec<OllamaModel> {
    query_ollama_tags()
        .ok()
        .and_then(|body| parse_ollama_tags(&body).ok())
        .unwrap_or_default()
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

    Ok(response
        .split_once("\r\n\r\n")
        .map(|(_, body)| body.to_string())
        .unwrap_or(response))
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
}
