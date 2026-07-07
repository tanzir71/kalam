import "@kalam/ui/styles.css";
import type { Settings } from "@kalam/core";
import { defaultSettings } from "@kalam/core";
import {
  ApiKeyField,
  BrandMark,
  Button,
  ListEditor,
  PrivacyBadge,
  SelectField,
  SegmentedControl,
  Toggle
} from "@kalam/ui";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadSettings, saveSettings } from "../shared/storage";
import "../popup/surface.css";

function Options() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  async function update(next: Settings) {
    setSettings(next);
    await saveSettings(next);
  }

  return (
    <main className="k-root ext-options">
      <aside className="ext-nav">
        <BrandMark lockup />
        <a href="#general">General</a>
        <a href="#models">Models & AI</a>
        <a href="#humanize">Humanize</a>
        <a href="#dictionary">Dictionary</a>
      </aside>
      <section className="ext-panel k-stack">
        <header className="ext-header">
          <h1>Kalam Settings</h1>
          <PrivacyBadge tier={settings.backend === "cloud" ? "cloud" : settings.backend === "noai" ? "noai" : "local"} />
        </header>
        <section id="general" className="k-card k-stack">
          <h2>General</h2>
          <SegmentedControl
            value={settings.backend}
            options={[
              { label: "No AI", value: "noai" },
              { label: "Local", value: "local" },
              { label: "Cloud", value: "cloud" }
            ]}
            onChange={(backend) => void update({ ...settings, backend })}
          />
          <Toggle
            label="Show privacy badge"
            checked={settings.privacy.showBadge}
            onChange={(showBadge) => void update({ ...settings, privacy: { showBadge } })}
          />
        </section>
        <section id="models" className="k-card k-stack">
          <h2>Models & AI</h2>
          <SelectField
            label="Cloud provider"
            value={settings.cloud.provider}
            options={[
              { label: "OpenAI", value: "openai" },
              { label: "Anthropic", value: "anthropic" }
            ]}
            onChange={(provider) =>
              void update({ ...settings, cloud: { ...settings.cloud, provider: provider as "openai" | "anthropic" } })
            }
          />
          <Toggle
            label="Enable cloud AI"
            checked={settings.cloud.enabled}
            onChange={(enabled) => void update({ ...settings, cloud: { ...settings.cloud, enabled } })}
          />
          <ApiKeyField
            value={settings.cloud.apiKey}
            storageLabel="stored in browser.storage.local, never sync"
            onChange={(apiKey) => void update({ ...settings, cloud: { ...settings.cloud, apiKey } })}
          />
        </section>
        <section id="humanize" className="k-card k-stack">
          <h2>Humanize</h2>
          <label className="k-field">
            <span className="k-label">Target score</span>
            <input
              className="k-input"
              type="number"
              value={settings.humanize.targetScore}
              onChange={(event) =>
                void update({
                  ...settings,
                  humanize: { ...settings.humanize, targetScore: Number(event.currentTarget.value) }
                })
              }
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => void update({ ...settings, humanizeAckAt: settings.humanizeAckAt ?? Date.now() })}
          >
            Acknowledge Humanize notice
          </Button>
        </section>
        <section id="dictionary" className="k-card k-stack">
          <h2>Dictionary</h2>
          <ListEditor
            label="Custom dictionary"
            values={settings.customDictionary}
            onAdd={(value) => void update({ ...settings, customDictionary: [...settings.customDictionary, value] })}
            onRemove={(value) =>
              void update({
                ...settings,
                customDictionary: settings.customDictionary.filter((entry) => entry !== value)
              })
            }
          />
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Options />);
