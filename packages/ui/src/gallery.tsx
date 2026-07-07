import type { Issue } from "@kalam/core";
import {
  ApiKeyField,
  BrandMark,
  Button,
  DiffView,
  EmptyState,
  ErrorState,
  FloatingActionBar,
  HumanizePanel,
  ListEditor,
  PrivacyBadge,
  ReadabilityMeter,
  RewriteGoalMenu,
  SegmentedControl,
  SuggestionCard,
  TierChip,
  Toast,
  Toggle
} from "./components";

const demoIssue: Issue = {
  id: "demo",
  range: { start: 0, end: 3 },
  type: "spelling",
  severity: "high",
  message: "Try a cleaner spelling here.",
  shortMessage: "Spelling",
  suggestions: ["the"],
  rule: "demo"
};

export function UiGallery() {
  return (
    <main className="k-root k-gallery">
      <header className="k-row" style={{ justifyContent: "space-between" }}>
        <BrandMark lockup />
        <div className="k-row">
          <PrivacyBadge tier="noai" />
          <PrivacyBadge tier="local" />
          <PrivacyBadge tier="cloud" provider="OpenAI" />
        </div>
      </header>
      <section className="k-gallery-grid">
        <SuggestionCard issue={demoIssue} before="teh" after="the" />
        <FloatingActionBar />
        <RewriteGoalMenu value="humanize" />
        <HumanizePanel beforeScore={76} afterScore={31} meaningPreserved passCount={2} tier="noai">
          <DiffView
            ops={[
              { type: "equal", text: "Kalam " },
              { type: "delete", text: "very " },
              { type: "insert", text: "clearly " },
              { type: "equal", text: "helps writing." }
            ]}
          />
        </HumanizePanel>
        <ReadabilityMeter grade={7.4} tone="Clear" words={86} characters={492} />
        <div className="k-card k-stack">
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Humanize</Button>
          <TierChip tier="noai" />
          <Toggle label="Enable site" checked />
          <SegmentedControl
            value="local"
            options={[
              { label: "No AI", value: "noai" },
              { label: "Local", value: "local" },
              { label: "Cloud", value: "cloud" }
            ]}
          />
          <ApiKeyField value="" />
          <ListEditor label="Dictionary" values={["Kalam", "Dhaka"]} />
        </div>
        <EmptyState title="Looks clean" />
        <ErrorState title="Ollama is not running" message="Kalam still works with local rules." />
        <Toast>Rewrite applied - Undo</Toast>
      </section>
    </main>
  );
}
