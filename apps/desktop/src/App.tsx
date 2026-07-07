import {
  DiffView,
  EmptyState,
  ErrorState,
  HumanizePanel,
  PrivacyBadge,
  ReadabilityMeter,
  SegmentedControl,
  SelectField,
  ApiKeyField,
  Button,
  BrandMark
} from "@kalam/ui";
import {
  HarperEngine,
  HeuristicDetector,
  MockAdapter,
  RuleAdapter,
  analyzeText,
  humanize,
  meaningPreserved,
  rewrite,
  type Issue
} from "@kalam/core";
import { useEffect, useMemo, useState } from "react";
import { listNativeModels, loadDesktopSettings, pullNativeModel, saveDesktopSettings, type NativeModel } from "./native";
import { useDesktopStore, type DesktopView } from "./store";

const grammar = new HarperEngine();
const detector = new HeuristicDetector();
const nav: Array<{ view: DesktopView; label: string }> = [
  { view: "editor", label: "Editor" },
  { view: "humanize", label: "Humanize" },
  { view: "batch", label: "Batch" },
  { view: "models", label: "Model Manager" },
  { view: "history", label: "History" },
  { view: "settings", label: "Settings" }
];

export function App() {
  const { view, setView, hydrateHistory } = useDesktopStore();

  useEffect(() => {
    hydrateHistory();
  }, [hydrateHistory]);

  return (
    <main className="k-root desktop-shell">
      <aside className="desktop-rail">
        <BrandMark lockup />
        <nav>
          {nav.map((item) => (
            <button
              key={item.view}
              type="button"
              aria-current={view === item.view ? "page" : undefined}
              onClick={() => setView(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="desktop-main">
        <TopBar />
        {view === "editor" ? <EditorWorkspace /> : null}
        {view === "humanize" ? <HumanizeWorkspace /> : null}
        {view === "batch" ? <BatchMode /> : null}
        {view === "models" ? <ModelManager /> : null}
        {view === "history" ? <HistoryView /> : null}
        {view === "settings" ? <SettingsView /> : null}
      </section>
    </main>
  );
}

function TopBar() {
  return (
    <header className="desktop-topbar">
      <h1>Kalam</h1>
      <div className="k-row">
        <PrivacyBadge tier="noai" />
        <Button variant="ghost">Boost with AI</Button>
      </div>
    </header>
  );
}

function EditorWorkspace() {
  const { text, issues, setText, setIssues, setLastResult, addHistory } = useDesktopStore();
  const stats = useMemo(() => analyzeText(text), [text]);

  async function runCheck() {
    setIssues(await grammar.check(text));
  }

  async function runRewrite() {
    const result = await rewrite(new RuleAdapter(), { text, goal: "improve" });
    setLastResult(result);
    setText(result.text);
    addHistory({ id: crypto.randomUUID(), original: text, rewritten: result.text, createdAt: Date.now() });
  }

  return (
    <div className="desktop-workspace">
      <section className="editor-pane">
        <textarea
          className="k-textarea desktop-editor"
          aria-label="Kalam editor"
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />
        <div className="k-row">
          <Button variant="primary" onClick={runCheck}>
            Check
          </Button>
          <Button variant="accent" onClick={runRewrite}>
            Rewrite
          </Button>
        </div>
      </section>
      <aside className="inspector-pane k-stack">
        <ReadabilityMeter grade={stats.fleschKincaidGrade} tone="Clear" words={stats.words} characters={stats.characters} />
        <IssueList issues={issues} />
      </aside>
    </div>
  );
}

function HumanizeWorkspace() {
  const { text, setText, lastResult, setLastResult, addHistory } = useDesktopStore();
  const [acknowledged, setAcknowledged] = useState(() => localStorage.getItem("kalam.humanizeAckAt") !== null);
  const meaning = lastResult ? meaningPreserved(text, lastResult.text).score >= 0.72 : true;

  async function runHumanize() {
    const result = await humanize({ llm: new MockAdapter(), detector }, text, {
      acknowledged: true,
      maxPasses: 3,
      targetScore: 35
    });
    setLastResult(result);
    setText(result.text);
    addHistory({ id: crypto.randomUUID(), original: text, rewritten: result.text, createdAt: Date.now() });
  }

  function acknowledge() {
    localStorage.setItem("kalam.humanizeAckAt", String(Date.now()));
    setAcknowledged(true);
  }

  return (
    <div className="desktop-workspace">
      <section className="editor-pane k-stack">
        <textarea
          className="k-textarea desktop-editor"
          aria-label="Humanize editor"
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />
        <Button variant="accent" onClick={runHumanize} disabled={!acknowledged}>
          Humanize
        </Button>
      </section>
      <aside className="inspector-pane">
        <HumanizePanel
          beforeScore={lastResult?.meta.scoreBefore ?? detector.score(text)}
          afterScore={lastResult?.meta.scoreAfter ?? detector.score(text)}
          meaningPreserved={meaning}
          passCount={lastResult?.meta.passes ?? 0}
          tier="noai"
          acknowledged={acknowledged}
          onAcknowledge={acknowledge}
          onLowerFurther={runHumanize}
          onRevert={() => setLastResult(undefined)}
        >
          {lastResult ? <DiffView ops={lastResult.diff} onAcceptAll={() => setText(lastResult.text)} /> : null}
        </HumanizePanel>
      </aside>
    </div>
  );
}

function BatchMode() {
  const [queue, setQueue] = useState("draft-one.md\ndraft-two.txt");
  const [done, setDone] = useState<string[]>([]);
  return (
    <section className="desktop-panel k-stack">
      <h2>Batch</h2>
      <textarea className="k-textarea" value={queue} onChange={(event) => setQueue(event.currentTarget.value)} />
      <Button
        variant="primary"
        onClick={() => setDone(queue.split(/\n+/).filter((item) => /\.(txt|md)$/i.test(item)))}
      >
        Run batch
      </Button>
      {done.length ? <p className="k-muted">{done.length} files queued for local rules.</p> : <EmptyState title="No files queued" />}
    </section>
  );
}

function ModelManager() {
  const [models, setModels] = useState<NativeModel[]>([]);
  const [error, setError] = useState("");
  const [modelName, setModelName] = useState("llama3.1:8b");
  const [pullStatus, setPullStatus] = useState("");
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadModels().then(({ models: loadedModels, error: loadError }) => {
      if (cancelled) return;
      setModels(loadedModels);
      setError(loadError);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadModels(): Promise<{ models: NativeModel[]; error: string }> {
    const nativeModels = await listNativeModels();
    if (nativeModels) return { models: nativeModels, error: "" };

    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (!response.ok) throw new Error("Ollama unavailable");
      const data = (await response.json()) as { models?: NativeModel[] };
      return { models: data.models ?? [], error: "" };
    } catch {
      return { models: [], error: "Ollama is not running" };
    }
  }

  async function pullModel() {
    setIsPulling(true);
    setPullStatus("Pulling model");
    const status = await pullNativeModel(modelName.trim());
    setIsPulling(false);
    if (!status) {
      setPullStatus("Ollama is not running. Kalam still works with local rules.");
      return;
    }
    const progress =
      status.completed && status.total ? ` (${Math.round((status.completed / status.total) * 100)}%)` : "";
    setPullStatus(`${status.status}${progress}`);
    if (status.done) {
      const loaded = await loadModels();
      setModels(loaded.models);
      setError(loaded.error);
    }
  }

  return (
    <section className="desktop-panel k-stack">
      <h2>Model Manager</h2>
      <div className="k-card k-stack">
        <label className="k-field">
          <span className="k-label">Model name</span>
          <input
            className="k-input"
            aria-label="Model name"
            value={modelName}
            onChange={(event) => setModelName(event.currentTarget.value)}
          />
        </label>
        <Button variant="primary" onClick={pullModel} loading={isPulling} disabled={!modelName.trim()}>
          Pull model
        </Button>
        {pullStatus ? <p className="k-muted">{pullStatus}</p> : null}
      </div>
      {error ? <ErrorState title={error} message="Kalam still works with local rules." /> : null}
      {models.length ? (
        <div className="model-list">
          {models.map((model) => (
            <article className="k-card" key={model.name}>
              <strong>{model.name}</strong>
              <p className="k-muted">{model.size ? `${Math.round(model.size / 1_000_000_000)} GB` : "Local model"}</p>
            </article>
          ))}
        </div>
      ) : !error ? (
        <EmptyState title="No local models found" />
      ) : null}
    </section>
  );
}

function HistoryView() {
  const history = useDesktopStore((state) => state.history);
  if (!history.length) return <EmptyState title="No history yet" />;
  return (
    <section className="desktop-panel k-stack">
      <h2>History</h2>
      {history.map((item) => (
        <article className="k-card k-stack" key={item.id}>
          <strong>{new Date(item.createdAt).toLocaleString()}</strong>
          <p className="k-muted">{item.rewritten}</p>
        </article>
      ))}
    </section>
  );
}

function SettingsView() {
  const [backend, setBackend] = useState<"noai" | "local" | "cloud">("noai");
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadDesktopSettings().then((settings) => {
      if (cancelled) return;
      setBackend(settings.backend);
      setProvider(settings.provider);
      setApiKey(settings.apiKey);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings() {
    const saved = await saveDesktopSettings({
      backend,
      cloudEnabled: backend === "cloud",
      provider,
      apiKey
    });
    setBackend(saved.backend);
    setProvider(saved.provider);
    setApiKey(saved.apiKey);
    setStatus("Settings saved");
  }

  return (
    <section className="desktop-panel k-stack">
      <h2>Settings</h2>
      <SegmentedControl
        value={backend}
        options={[
          { label: "No AI", value: "noai" },
          { label: "Local", value: "local" },
          { label: "Cloud", value: "cloud" }
        ]}
        onChange={setBackend}
      />
      <SelectField
        label="Provider"
        value={provider}
        options={[
          { label: "OpenAI", value: "openai" },
          { label: "Anthropic", value: "anthropic" }
        ]}
        onChange={setProvider}
      />
      <ApiKeyField value={apiKey} onChange={setApiKey} storageLabel="stored in your OS keychain" />
      <Button variant="primary" onClick={saveSettings}>
        Save settings
      </Button>
      {status ? <p className="k-muted">{status}</p> : null}
    </section>
  );
}

function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return <EmptyState title="Looks clean" />;
  return (
    <section className="k-card k-stack" aria-label="Issue list">
      <strong>{issues.length} suggestions</strong>
      {issues.map((issue) => (
        <article key={issue.id} className="issue-row">
          <span data-type={issue.type}>{issue.type}</span>
          <p>{issue.message}</p>
        </article>
      ))}
    </section>
  );
}
