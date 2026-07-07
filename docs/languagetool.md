# Local LanguageTool

Kalam's `LanguageToolEngine` talks to a local HTTP server and returns `[]` when the server is unavailable.

Run LanguageTool locally with Docker:

```bash
docker run --rm -p 8081:8010 silviof/docker-languagetool:latest
```

Then call the engine at:

```text
http://localhost:8081/v2/check
```

The desktop app keeps this as an optional deep-check path; live checks continue to work with local rules when LanguageTool is offline.
