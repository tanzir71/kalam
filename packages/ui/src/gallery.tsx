import type { Issue } from "@kalam/core";
import type { ReactNode } from "react";
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
  Toggle,
  Underline
} from "./components";

const demoIssue = (type: Issue["type"], shortMessage: string): Issue => ({
  id: "demo",
  range: { start: 0, end: 3 },
  type,
  severity: type === "spelling" || type === "grammar" ? "high" : "low",
  message: "Try a cleaner wording here.",
  shortMessage,
  suggestions: type === "spelling" ? ["the"] : [],
  rule: "demo"
});

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

      <GallerySection title="Suggestion states">
        <SuggestionCard issue={demoIssue("spelling", "Spelling")} before="teh" after="the" />
        <SuggestionCard issue={demoIssue("grammar", "Grammar")} before="are not not" after="are not" />
        <SuggestionCard issue={demoIssue("style", "Style")} before="very clear" after="clear" />
        <SuggestionCard issue={demoIssue("readability", "Readability")} before="A long sentence" after="Two shorter sentences" />
      </GallerySection>

      <GallerySection title="Action states">
        <FloatingActionBar />
        <RewriteGoalMenu value="humanize" />
      </GallerySection>

      <GallerySection title="Humanize states">
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
        <HumanizePanel beforeScore={58} afterScore={52} meaningPreserved={false} passCount={1} tier="local" />
        <HumanizePanel beforeScore={64} afterScore={29} meaningPreserved passCount={3} tier="cloud" acknowledged={false} />
      </GallerySection>

      <GallerySection title="Meter and underline states">
        <ReadabilityMeter grade={7.4} tone="Clear" words={86} characters={492} />
        <div className="k-card k-stack">
          <span>Spelling underline <Underline type="spelling" /></span>
          <span>Grammar underline <Underline type="grammar" /></span>
          <span>Style underline <Underline type="style" /></span>
          <span>Readability underline <Underline type="readability" /></span>
        </div>
      </GallerySection>

      <GallerySection title="Button states">
        <div className="k-card k-stack">
          <Button variant="primary">Primary</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="accent">Humanize</Button>
          <Button variant="ghost">Ghost</Button>
          <TierChip tier="noai" />
          <TierChip tier="local" />
          <TierChip tier="cloud" />
        </div>
      </GallerySection>

      <GallerySection title="Form states">
        <div className="k-card k-stack">
          <Toggle label="Enable site" checked />
          <Toggle label="Disable cloud" checked={false} />
          <SegmentedControl
            value="local"
            options={[
              { label: "No AI", value: "noai" },
              { label: "Local", value: "local" },
              { label: "Cloud", value: "cloud" }
            ]}
          />
          <ApiKeyField value="" storageLabel="stored outside settings.json" />
          <ListEditor label="Dictionary" values={["Kalam", "Dhaka"]} />
        </div>
      </GallerySection>

      <GallerySection title="Empty and error states">
        <EmptyState title="Looks clean" />
        <EmptyState title="No local models found" action={<TierChip tier="noai" />} />
        <ErrorState title="Ollama is not running" message="Kalam still works with local rules." />
        <ErrorState title="Cloud disabled" message="Enable cloud AI only when you want text sent to your provider." />
        <ErrorState title="Model timeout" message="Kalam used local rules for this rewrite." />
        <EmptyState title="Offline ready" />
        <Toast>Rewrite applied - Undo</Toast>
      </GallerySection>
    </main>
  );
}

function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="k-stack" aria-label={title}>
      <h2>{title}</h2>
      <div className="k-gallery-grid">{children}</div>
    </section>
  );
}
