import type { DiffOp, Issue, RewriteGoal } from "@kalam/core";
import {
  BookOpen,
  Check,
  ChevronDown,
  Cloud,
  Gauge,
  ListPlus,
  Loader2,
  RotateCcw,
  Shield,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";

export function Button({
  children,
  variant = "secondary",
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button className={`k-button k-button-${variant}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function PrivacyBadge({
  tier,
  provider
}: {
  tier: "local" | "cloud" | "noai";
  provider?: string;
}) {
  const label =
    tier === "cloud" ? `Cloud: ${provider ?? "provider"}` : tier === "local" ? "Local" : "No AI - rules";
  const Icon = tier === "cloud" ? Cloud : Shield;
  return (
    <span
      className={`k-badge k-badge-${tier}`}
      aria-label={`Privacy mode: ${label}`}
      title={
        tier === "cloud"
          ? "Cloud provider is active for text transformations."
          : "Text transformations stay on this device."
      }
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}

export function TierChip({
  tier,
  onBoost
}: {
  tier: "noai" | "local" | "cloud";
  onBoost?: () => void;
}) {
  if (tier === "cloud") return <span className="k-chip k-badge-cloud">Best tier</span>;
  return (
    <button className="k-chip k-button k-button-ghost" type="button" onClick={onBoost}>
      <Sparkles size={14} aria-hidden="true" />
      {tier === "noai" ? "Boost with AI" : "Use cloud boost"}
    </button>
  );
}

export function SuggestionCard({
  issue,
  before,
  after,
  onApply,
  onDismiss,
  onAddToDictionary
}: {
  issue: Issue;
  before?: string;
  after?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  onAddToDictionary?: () => void;
}) {
  return (
    <section className="k-popover k-stack" role="dialog" aria-label={`${issue.type} suggestion`}>
      <div className="k-row">
        <IssueIcon type={issue.type} />
        <strong>{issue.shortMessage}</strong>
      </div>
      <p className="k-muted">{issue.message}</p>
      {before || after ? (
        <div className="k-card k-diff" aria-label="Before and after preview">
          {before ? <del>{before}</del> : null}
          {after ? <ins>{after}</ins> : null}
        </div>
      ) : null}
      <div className="k-row">
        <Button variant="primary" onClick={onApply}>
          <Check size={16} aria-hidden="true" />
          Apply
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          <X size={16} aria-hidden="true" />
          Dismiss
        </Button>
        {issue.type === "spelling" ? (
          <Button variant="ghost" onClick={onAddToDictionary}>
            <BookOpen size={16} aria-hidden="true" />
            Add
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function FloatingActionBar({
  onRewrite,
  onHumanize,
  onCheck
}: {
  onRewrite?: () => void;
  onHumanize?: () => void;
  onCheck?: () => void;
}) {
  return (
    <div className="k-toolbar" role="toolbar" aria-label="Writing actions">
      <Button onClick={onRewrite}>
        Rewrite
        <ChevronDown size={16} aria-hidden="true" />
      </Button>
      <Button variant="accent" onClick={onHumanize}>
        <Wand2 size={16} aria-hidden="true" />
        Humanize
      </Button>
      <Button variant="ghost" onClick={onCheck}>
        <Gauge size={16} aria-hidden="true" />
        Check
      </Button>
    </div>
  );
}

const goalLabels: Array<{ goal: RewriteGoal; label: string; description: string }> = [
  { goal: "improve", label: "Improve", description: "Clean up clarity and flow" },
  { goal: "shorten", label: "Shorten", description: "Cut excess words" },
  { goal: "expand", label: "Expand", description: "Add useful context" },
  { goal: "formal", label: "Formal", description: "Use a polished register" },
  { goal: "casual", label: "Casual", description: "Sound natural and lighter" },
  { goal: "confident", label: "Confident", description: "Remove hedging" },
  { goal: "simplify", label: "Simplify", description: "Make it easier to read" },
  { goal: "humanize", label: "Humanize", description: "Keep meaning, sound human" }
];

export function RewriteGoalMenu({
  value,
  onSelect
}: {
  value?: RewriteGoal;
  onSelect?: (goal: RewriteGoal) => void;
}) {
  return (
    <div className="k-popover k-stack" role="menu" aria-label="Rewrite goals">
      {goalLabels.map((item) => (
        <button
          key={item.goal}
          className="k-button k-button-ghost"
          type="button"
          aria-pressed={value === item.goal}
          onClick={() => onSelect?.(item.goal)}
        >
          {item.goal === "humanize" ? <Wand2 size={16} /> : <Sparkles size={16} />}
          <span>
            <strong>{item.label}</strong>
            <br />
            <span className="k-muted">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function HumanizePanel({
  beforeScore,
  afterScore,
  meaningPreserved,
  passCount,
  tier,
  children,
  onLowerFurther,
  onRevert,
  onAcknowledge,
  acknowledged = true
}: {
  beforeScore: number;
  afterScore: number;
  meaningPreserved: boolean;
  passCount: number;
  tier: "noai" | "local" | "cloud";
  children?: ReactNode;
  onLowerFurther?: () => void;
  onRevert?: () => void;
  onAcknowledge?: () => void;
  acknowledged?: boolean;
}) {
  return (
    <section className="k-card k-stack" aria-label="Humanize panel">
      <div className="k-row" style={{ justifyContent: "space-between" }}>
        <strong>Humanize</strong>
        <PrivacyBadge tier={tier === "noai" ? "noai" : tier} provider={tier === "cloud" ? "OpenAI" : undefined} />
      </div>
      {!acknowledged ? (
        <div className="k-card k-stack">
          <p className="k-muted">
            Humanize rewrites your text to read more naturally. Use it on your own work. Do not use it to
            misrepresent authorship where that is prohibited.
          </p>
          <Button variant="primary" onClick={onAcknowledge}>
            I understand
          </Button>
        </div>
      ) : null}
      <ScorePair before={beforeScore} after={afterScore} />
      <p className="k-muted">Estimated - real detectors vary.</p>
      <div className="k-row">
        <span className={meaningPreserved ? "k-badge k-badge-local" : "k-badge k-badge-cloud"}>
          {meaningPreserved ? "Meaning preserved" : "Check meaning"}
        </span>
        <span className="k-muted">Pass {passCount}</span>
      </div>
      {tier === "noai" ? <p className="k-muted">Rules only - connect a local model for stronger results.</p> : null}
      {children}
      <div className="k-row">
        <Button variant="accent" onClick={onLowerFurther}>
          Lower further
        </Button>
        <Button variant="ghost" onClick={onRevert}>
          <RotateCcw size={16} aria-hidden="true" />
          Revert
        </Button>
      </div>
    </section>
  );
}

export function DiffView({
  ops,
  onAcceptAll
}: {
  ops: DiffOp[];
  onAcceptAll?: () => void;
}) {
  return (
    <div className="k-card k-stack">
      <div className="k-diff" aria-label="Rewrite diff">
        {ops.map((op, index) =>
          op.type === "insert" ? (
            <ins key={index}>{op.text}</ins>
          ) : op.type === "delete" ? (
            <del key={index}>{op.text}</del>
          ) : (
            <span key={index}>{op.text}</span>
          )
        )}
      </div>
      <Button variant="primary" onClick={onAcceptAll}>
        Accept all
      </Button>
    </div>
  );
}

export function ReadabilityMeter({
  grade,
  tone,
  words,
  characters
}: {
  grade: number;
  tone: string;
  words: number;
  characters: number;
}) {
  const percentage = Math.max(0, Math.min(100, 100 - grade * 7));
  return (
    <section className="k-card k-stack" aria-label="Readability meter">
      <div className="k-row">
        <Gauge size={18} aria-hidden="true" />
        <strong>Grade {grade}</strong>
        <span className="k-muted">{tone}</span>
      </div>
      <div className="k-meter" aria-label={`Readability grade ${grade}`}>
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="k-muted">
        {words} words / {characters} chars
      </p>
    </section>
  );
}

export function Underline({ type = "spelling" }: { type?: Issue["type"] }) {
  return <span className="k-underline" data-type={type} aria-hidden="true" />;
}

export function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="k-switch">
      <input type="checkbox" checked={checked} onChange={(event) => onChange?.(event.currentTarget.checked)} />
      {label}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="k-field">
      <span className="k-label">{label}</span>
      <select className="k-select" value={value} onChange={(event) => onChange?.(event.currentTarget.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange?: (value: T) => void;
}) {
  return (
    <div className="k-segmented" role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ApiKeyField({
  value,
  storageLabel = "stored in your OS keychain",
  onChange
}: {
  value: string;
  storageLabel?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="k-field">
      <span className="k-label">API key</span>
      <input
        className="k-input"
        type="password"
        value={value}
        placeholder="sk-..."
        onChange={(event) => onChange?.(event.currentTarget.value)}
      />
      <span className="k-subtle">{storageLabel}</span>
    </label>
  );
}

export function ListEditor({
  label,
  values,
  onAdd,
  onRemove
}: {
  label: string;
  values: string[];
  onAdd?: (value: string) => void;
  onRemove?: (value: string) => void;
}) {
  function submit(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value.trim();
    if (value) {
      onAdd?.(value);
      event.currentTarget.value = "";
    }
  }

  return (
    <div className="k-field">
      <span className="k-label">{label}</span>
      <div className="k-row">
        <ListPlus size={16} aria-hidden="true" />
        <input className="k-input" onBlur={submit} placeholder="Add an entry" />
      </div>
      <div className="k-row" style={{ flexWrap: "wrap" }}>
        {values.map((value) => (
          <button className="k-chip" key={value} type="button" onClick={() => onRemove?.(value)}>
            {value}
            <X size={12} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <section className="k-card k-stack" aria-label="Empty state">
      <strong>{title}</strong>
      {action}
    </section>
  );
}

export function ErrorState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <section className="k-card k-stack" role="alert">
      <strong>{title}</strong>
      <p className="k-muted">{message}</p>
      {action}
    </section>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="k-popover" role="status" aria-live="polite">
      {children}
    </div>
  );
}

export function BrandMark({ lockup = false }: { lockup?: boolean }) {
  return (
    <span className="k-row" aria-label="Kalam">
      <Wand2 size={22} color="var(--k-primary)" aria-hidden="true" />
      {lockup ? (
        <span>
          <strong>Kalam</strong>
          <span className="k-muted"> Write clearly. Sound human.</span>
        </span>
      ) : (
        <strong>Kalam</strong>
      )}
    </span>
  );
}

function IssueIcon({ type }: { type: Issue["type"] }) {
  const color =
    type === "spelling"
      ? "var(--k-spelling)"
      : type === "grammar"
        ? "var(--k-grammar)"
        : type === "readability"
          ? "var(--k-readability)"
          : "var(--k-style)";
  return <Gauge size={16} color={color} aria-hidden="true" />;
}

function ScorePair({ before, after }: { before: number; after: number }) {
  return (
    <div className="k-gallery-grid">
      <Score label="Before" value={before} />
      <Score label="After" value={after} />
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="k-card k-stack" aria-label={`${label} estimated AI-likelihood: ${value} of 100`}>
      <span className="k-muted">{label}</span>
      <strong>{value}/100</strong>
      <div className="k-meter">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
