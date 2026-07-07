import "@kalam/ui/styles.css";
import { BrandMark, Button, PrivacyBadge, ReadabilityMeter, Toggle } from "@kalam/ui";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadSiteEnabled, saveSiteEnabled } from "../shared/storage";
import "./surface.css";

function Popup() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    void loadSiteEnabled().then(setEnabled);
  }, []);

  async function updateEnabled(next: boolean) {
    setEnabled(next);
    await saveSiteEnabled(next);
  }

  return (
    <main className="k-root ext-popup">
      <header className="ext-header">
        <BrandMark />
        <PrivacyBadge tier="noai" />
      </header>
      <Toggle label="Enable on this site" checked={enabled} onChange={updateEnabled} />
      <ReadabilityMeter grade={6.8} tone="Clear" words={124} characters={716} />
      <Button variant="primary" onClick={() => chrome.runtime.openOptionsPage()}>
        Open full settings
      </Button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
