import {
  HarperEngine,
  HeuristicDetector,
  RuleAdapter,
  analyzeText,
  humanize,
  meaningPreserved,
  type Issue,
  type RewriteResult
} from "@kalam/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { applySuggestion, buildSegments, readingLabel } from "./playground";

const grammar = new HarperEngine();
const detector = new HeuristicDetector();
const seededText =
  "Teh team definately shipped 3 builds in Dhaka. Moreover, Kalam reports that the release is not not ready for everyone. This solution provides a comprehensive framework in order to improve the writing.";
const cleanText =
  "The team shipped 3 builds in Dhaka. The release still needs a final review, so the rollout will begin with a smaller group.";
const githubUrl = "https://github.com/tanzir71/kalam";
const agentPrompt =
  "Open https://kalam-write.vercel.app/llms.txt and https://github.com/tanzir71/kalam. Add Kalam's deterministic RuleAdapter to my writing flow first. Keep cloud.enabled false, preserve the privacy-tier badge, and only propose a local Ollama path as an explicit optional upgrade.";

function IconArrow() {
  return <span aria-hidden="true">↗</span>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className={`copy-button${copied ? " is-copied" : ""}`} type="button" onClick={copy}>
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function Navigation() {
  const [open, setOpen] = useState(false);
  const links = [
    ["How it works", "#system"],
    ["Privacy", "#privacy"],
    ["Compare", "#compare"],
    ["Demo", "#demo"]
  ];

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Kalam home">
        <span className="brand-mark" aria-hidden="true">ক</span>
        <span>KALAM</span>
      </a>
      <button
        className="menu-button"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
      <nav id="site-navigation" className={open ? "is-open" : ""} aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <a className="nav-github" href={githubUrl}>GitHub <IconArrow /></a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="release-line"><span>v0.1</span> MIT · CHROME · FIREFOX · WINDOWS</p>
        <h1 id="hero-title">Grammarly-class checks.<br /><em>Zero cloud. $0.</em></h1>
        <p className="hero-lede">
          Grammar, style, readability, and Humanize without uploading every keystroke.
          Rules always work. Local models are optional. Cloud stays off until you explicitly enable it with your key.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#demo">Try the live demo <span aria-hidden="true">↓</span></a>
          <a className="button ghost" href="#setup">Set it up</a>
        </div>
      </div>
      <div className="hero-sheet" aria-label="Kalam privacy pipeline">
        <div className="sheet-head"><span>TRANSFORMATION ROUTE</span><b>DEFAULT / NO-AI</b></div>
        <div className="route-row active"><span>01</span><div><b>RULES</b><small>Runs on this device</small></div><em>ON</em></div>
        <div className="route-line" />
        <div className="route-row"><span>02</span><div><b>LOCAL MODEL</b><small>Ollama or LM Studio</small></div><em>OPT-IN</em></div>
        <div className="route-line" />
        <div className="route-row"><span>03</span><div><b>BYO CLOUD</b><small>Your key + explicit enable</small></div><em>OFF</em></div>
        <p className="sheet-note">Every transformation carries its processing tier.</p>
      </div>
      <div className="stats-strip" aria-label="Product facts">
        <div><b>$0</b><span>MIT software</span></div>
        <div><b>3</b><span>privacy tiers</span></div>
        <div><b>2</b><span>browser targets</span></div>
        <div><b>0</b><span>cloud accounts required</span></div>
      </div>
    </section>
  );
}

function SystemSection() {
  const steps = [
    ["01", "CHECK", "Deterministic spelling, grammar, style, and readability checks run from @kalam/core."],
    ["02", "CHOOSE", "Stay with rules, connect your own local model, or explicitly unlock BYO cloud."],
    ["03", "TRANSFORM", "Rewrite goals and Humanize preserve numbers, names, citations, and Markdown boundaries."],
    ["04", "VERIFY", "Review the diff, meaning score, and privacy badge before accepting a change."]
  ];
  return (
    <section className="section shell" id="system" aria-labelledby="system-title">
      <SectionLabel>SYS · 01 / THE WHOLE LOOP</SectionLabel>
      <div className="section-heading split-heading">
        <h2 id="system-title">One shared brain.<br />Two native surfaces.</h2>
        <p>The extension and Windows desktop app call the same TypeScript core. The browser demo below calls it too.</p>
      </div>
      <div className="system-grid">
        {steps.map(([number, title, body]) => (
          <article key={number} className="system-card">
            <span>{number}</span><h3>{title}</h3><p>{body}</p>
          </article>
        ))}
      </div>
      <div className="architecture-line" aria-label="Core architecture">
        <span>CHROME / FIREFOX</span><i>→</i><b>@kalam/core</b><i>←</i><span>TAURI / WINDOWS</span>
      </div>
    </section>
  );
}

function SetupSection() {
  return (
    <section className="section shell" id="setup" aria-labelledby="setup-title">
      <SectionLabel>SYS · 02 / START IN FIVE MINUTES</SectionLabel>
      <div className="section-heading"><h2 id="setup-title">Start with rules.<br />Upgrade only if you need to.</h2></div>
      <div className="setup-grid">
        <article className="setup-card featured">
          <span className="setup-number">01 / ASK YOUR AGENT</span>
          <h3>Hand it the privacy contract.</h3>
          <p>The agent-readable file names the real adapters, defaults, and guardrails.</p>
          <pre><code>{agentPrompt}</code></pre>
          <CopyButton value={agentPrompt} label="Copy agent prompt" />
        </article>
        <article className="setup-card">
          <span className="setup-number">02 / CLONE</span>
          <h3>Build every surface.</h3>
          <p>Node 22+ and pnpm 10+ are the base path. Rust is needed only for desktop packaging.</p>
          <pre><code>git clone {githubUrl}{"\n"}cd kalam && pnpm install{"\n"}pnpm -r build</code></pre>
          <CopyButton value={`git clone ${githubUrl}\ncd kalam && pnpm install\npnpm -r build`} />
        </article>
        <article className="setup-card">
          <span className="setup-number">03 / LOAD</span>
          <h3>Use the browser build.</h3>
          <p>Load the Chrome or Firefox output as an unpacked extension. No account or API key is part of setup.</p>
          <pre><code>pnpm --filter @kalam/extension build{"\n"}# apps/extension/dist/chrome</code></pre>
          <a className="text-link" href={`${githubUrl}#getting-started-from-zero`}>Read setup notes <IconArrow /></a>
        </article>
      </div>
    </section>
  );
}

function PrivacySection() {
  const tiers = [
    ["01", "NO-AI", "DEFAULT", "Deterministic checks and rule rewrites. Nothing leaves the device. Always available."],
    ["02", "LOCAL AI", "OPTIONAL", "Connect Ollama or LM Studio on your hardware. Kalam stays usable when neither is installed."],
    ["03", "BYO CLOUD", "LOCKED", "Provide your own OpenAI or Anthropic key and set cloud.enabled=true. Both gates are required."]
  ];
  return (
    <section className="section privacy-section" id="privacy" aria-labelledby="privacy-title">
      <div className="shell">
        <SectionLabel>SYS · 03 / PRIVACY LADDER</SectionLabel>
        <div className="section-heading split-heading">
          <h2 id="privacy-title">Privacy is a visible state,<br />not a promise in the footer.</h2>
          <p>Every transformation is badged. “No model found” routes back to rules instead of blocking your work.</p>
        </div>
        <div className="tier-grid">
          {tiers.map(([number, name, state, body], index) => (
            <article className={index === 0 ? "tier-card active" : "tier-card"} key={number}>
              <div><span>{number}</span><em>{state}</em></div><h3>{name}</h3><p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IssueHighlights({ text, issues }: { text: string; issues: Issue[] }) {
  return (
    <div className="highlight-view" aria-label={`${issues.length} highlighted writing issues`}>
      {buildSegments(text, issues).map((segment, index) => segment.issue ? (
        <mark className={`issue-${segment.issue.type}`} key={`${segment.issue.id}-${index}`} title={segment.issue.message}>
          {segment.text}
        </mark>
      ) : <span key={`text-${index}`}>{segment.text}</span>)}
    </div>
  );
}

function Playground() {
  const [text, setText] = useState(seededText);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [activeView, setActiveView] = useState<"issues" | "humanize">("issues");
  const stats = useMemo(() => analyzeText(text), [text]);
  const machineScore = useMemo(() => detector.score(text), [text]);
  const meaning = result ? meaningPreserved(text, result.text) : null;

  async function runCheck(source = text) {
    setChecking(true);
    setIssues(await grammar.check(source));
    setActiveView("issues");
    setChecking(false);
  }

  useEffect(() => {
    let cancelled = false;
    void grammar.check(seededText).then((initialIssues) => {
      if (!cancelled) setIssues(initialIssues);
    });
    return () => { cancelled = true; };
  }, []);

  async function runHumanize() {
    setHumanizing(true);
    const next = await humanize({ llm: new RuleAdapter(), detector }, text, {
      acknowledged: true,
      maxPasses: 2,
      targetScore: 25
    });
    setResult(next);
    setActiveView("humanize");
    setHumanizing(false);
  }

  function updateText(next: string) {
    setText(next);
    setIssues([]);
    setResult(null);
  }

  async function useSuggestion(issue: Issue, suggestion: string) {
    const next = applySuggestion(text, issue, suggestion);
    setText(next);
    setResult(null);
    await runCheck(next);
  }

  function reset() {
    updateText(seededText);
    void runCheck(seededText);
  }

  return (
    <section className="section shell" id="demo" aria-labelledby="demo-title">
      <SectionLabel>SYS · 04 / LIVE BROWSER PLAYGROUND</SectionLabel>
      <div className="section-heading split-heading">
        <h2 id="demo-title">Your text stays in this tab.</h2>
        <p>This demo imports the real <code>@kalam/core</code>. It uses the deterministic rules tier only and makes no network request.</p>
      </div>
      <div className="demo-banner"><span className="pulse" /> LIVE LOCAL DEMO <em>RULEADAPTER · NO-AI · NO STORAGE</em></div>
      <div className="playground">
        <section className="editor-panel" aria-label="Writing input">
          <div className="panel-head"><span>INPUT / PLAIN TEXT</span><button type="button" onClick={reset}>Reset demo</button></div>
          <textarea
            aria-label="Text to check"
            value={text}
            onChange={(event) => updateText(event.currentTarget.value)}
            spellCheck={false}
          />
          <div className="editor-actions">
            <button className="button primary" type="button" onClick={() => void runCheck()} disabled={checking || !text.trim()}>
              {checking ? "Checking…" : "Check writing"}
            </button>
            <button className="button ghost" type="button" onClick={() => void runHumanize()} disabled={humanizing || !text.trim()}>
              {humanizing ? "Humanizing…" : "Humanize locally"}
            </button>
            <button className="sample-button" type="button" onClick={() => { updateText(cleanText); void runCheck(cleanText); }}>Load clean sample</button>
          </div>
          <dl className="text-stats">
            <div><dt>WORDS</dt><dd>{stats.words}</dd></div>
            <div><dt>GRADE</dt><dd>{stats.fleschKincaidGrade}</dd></div>
            <div><dt>READ</dt><dd>{readingLabel(stats.fleschKincaidGrade)}</dd></div>
            <div><dt>AI-LIKE</dt><dd>{machineScore}%</dd></div>
          </dl>
        </section>
        <section className="results-panel" aria-label="Writing results">
          <div className="result-tabs" role="tablist" aria-label="Result view">
            <button type="button" role="tab" aria-selected={activeView === "issues"} onClick={() => setActiveView("issues")}>Issues <span>{issues.length}</span></button>
            <button type="button" role="tab" aria-selected={activeView === "humanize"} onClick={() => setActiveView("humanize")}>Humanize</button>
            <em>NO-AI</em>
          </div>
          {activeView === "issues" ? (
            <div className="issues-view" role="tabpanel">
              <IssueHighlights text={text} issues={issues} />
              <div className="issue-list" aria-live="polite">
                {issues.length ? issues.map((issue) => (
                  <article className="issue-row" key={issue.id}>
                    <div><span className={`issue-dot ${issue.severity}`} /><b>{issue.shortMessage}</b><em>{issue.type}</em></div>
                    <p>{issue.message}</p>
                    {issue.suggestions[0] ? <button type="button" onClick={() => void useSuggestion(issue, issue.suggestions[0])}>Use “{issue.suggestions[0]}”</button> : null}
                  </article>
                )) : <div className="empty-result"><b>{text.trim() ? "No rule issues found." : "Add text to begin."}</b><p>Rules are deterministic. They do not pretend to understand every sentence.</p></div>}
              </div>
            </div>
          ) : (
            <div className="humanize-view" role="tabpanel">
              {result ? <>
                <div className="humanize-meta">
                  <span>PRIVACY <b>{result.meta.tier?.toUpperCase() ?? "NOAI"}</b></span>
                  <span>AI-LIKE <b>{result.meta.scoreBefore}% → {result.meta.scoreAfter}%</b></span>
                  <span>MEANING <b>{Math.round((meaning?.score ?? 0) * 100)}%</b></span>
                </div>
                <p className="humanize-copy">{result.text}</p>
                <div className="guard-row">
                  <span className={meaning?.numbersPreserved ? "pass" : "fail"}>Numbers {meaning?.numbersPreserved ? "preserved" : "changed"}</span>
                  <span className={meaning?.entitiesPreserved ? "pass" : "fail"}>Names {meaning?.entitiesPreserved ? "preserved" : "changed"}</span>
                </div>
                <div className="result-actions"><button className="button primary" type="button" onClick={() => updateText(result.text)}>Use this version</button><CopyButton value={result.text} /></div>
              </> : <div className="empty-result"><b>No Humanize preview yet.</b><p>Run the local Humanize path to remove formulaic phrasing while checking meaning preservation.</p></div>}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ["Kalam", "$0 / MIT", "Rules on-device by default", "Local + explicit BYO cloud"],
    ["Grammarly Pro", "$12/mo annual · $30/mo monthly", "Cloud processing", "Managed cloud"],
    ["LanguageTool Premium", "€4.90–19.90/mo by term", "Cloud; DIY self-host exists", "Managed or self-hosted"],
    ["QuillBot", "Plan-dependent", "Cloud paraphrasing", "Managed cloud"]
  ];
  return (
    <section className="section compare-section" id="compare" aria-labelledby="compare-title">
      <div className="shell">
        <SectionLabel>SYS · 05 / COMPARE THE DEFAULTS</SectionLabel>
        <div className="section-heading"><h2 id="compare-title">The difference is where<br />your sentence goes.</h2></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Price</th><th>Default processing</th><th>Model path</th></tr></thead>
            <tbody>{rows.map((row, index) => <tr className={index === 0 ? "our-row" : ""} key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="comparison-note">Comparison reflects each product’s general positioning and pricing as of July 2026 — verify on each vendor’s site. QuillBot pricing is intentionally omitted because the handoff does not provide a verified figure.</p>
      </div>
    </section>
  );
}

function ScopeAndFaq() {
  const scope = [
    ["Rules are not GPT", "Deterministic mode catches known spelling, grammar, style, and readability patterns. It does not claim deep contextual rewriting."],
    ["Local AI needs hardware", "Ollama and LM Studio use your machine. Model speed and quality depend on the model and hardware you choose."],
    ["Cloud needs two keys", "A provider key alone does nothing. You must also explicitly enable cloud mode before a cloud adapter can run."]
  ];
  const faqs = [
    ["Is anything sent to a server?", "Not in rules mode, and not in local-model mode. Cloud requests happen only after you provide a key and explicitly enable cloud processing."],
    ["Do I need Ollama?", "No. RuleAdapter is the default and always works. Ollama or LM Studio is an optional local upgrade."],
    ["Is Kalam Windows-only?", "The desktop app currently targets Windows. The Manifest V3 extension builds for Chrome and Firefox."],
    ["Does Humanize bypass AI detectors?", "No such promise is made. Kalam removes formulaic patterns and checks meaning preservation; detector scores are heuristics, not guarantees."],
    ["Where are API keys stored?", "On Windows, desktop keys use Credential Manager and stay out of settings.json. Browser cloud use remains opt-in."],
    ["Can I use it commercially?", "Yes. Kalam is MIT-licensed; review the license file for the full terms."]
  ];
  return (
    <>
      <section className="section shell" aria-labelledby="scope-title">
        <SectionLabel>SYS · 06 / HONEST SCOPE</SectionLabel>
        <div className="section-heading"><h2 id="scope-title">What Kalam deliberately<br />doesn’t pretend to do.</h2></div>
        <div className="scope-grid">{scope.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>
      <section className="section faq-section" id="faq" aria-labelledby="faq-title">
        <div className="shell">
          <SectionLabel>SYS · 07 / FAQ</SectionLabel>
          <div className="section-heading"><h2 id="faq-title">Before you install.</h2></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>0{index + 1}</span>{question}<i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>
    </>
  );
}

function Footer() {
  return (
    <footer>
      <section className="support shell">
        <div><SectionLabel>SUPPORT THE WORK</SectionLabel><h2>Free forever.<br />Fueled by coffee.</h2></div>
        <a className="button primary" href="https://buymeacoffee.com/tanzir">Buy me a coffee <IconArrow /></a>
      </section>
      <div className="footer-line shell">
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">ক</span><span>KALAM</span></a>
        <p>built by <a href="https://tanziro.com">tanziro.com</a></p>
        <nav aria-label="Footer navigation"><a href="/llms.txt">llms.txt</a><a href="#demo">demo</a><a href="#compare">compare</a><a href={githubUrl}>GitHub</a></nav>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="top" />
      <Navigation />
      <main id="main">
        <Hero />
        <SystemSection />
        <SetupSection />
        <PrivacySection />
        <Playground />
        <ComparisonSection />
        <ScopeAndFaq />
      </main>
      <Footer />
    </>
  );
}
