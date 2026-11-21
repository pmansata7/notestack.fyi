import { useState } from "react";
import { saveSettings, testIntegrationConnector } from "../api";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { formatInvokeError } from "../lib/errors";
import { normalizeSettings } from "../lib/settings";
import type { AppSettings } from "../types";

interface Props {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
}

type ConnectorId = "calendar" | "slack" | "notion" | "zapier" | "crm";

const CRM_HINTS = [
  { id: "hubspot", label: "HubSpot", hint: "Route Zapier → HubSpot contact or deal" },
  { id: "attio", label: "Attio", hint: "Map action items to Attio via Zapier" },
  { id: "affinity", label: "Affinity", hint: "Sync summaries with Affinity notes" },
];

export function ConnectorsPanel({ settings, onSettingsChange }: Props) {
  const [draft, setDraft] = useState(normalizeSettings(settings));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [active, setActive] = useState<ConnectorId>("slack");

  const calendar = useGoogleCalendar(settings, onSettingsChange);

  const persist = async (next: AppSettings) => {
    const normalized = normalizeSettings(next);
    setDraft(normalized);
    await saveSettings(normalized);
    onSettingsChange(normalized);
  };

  const saveDraft = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await persist(draft);
      setMessage("Connectors saved.");
    } finally {
      setBusy(false);
    }
  };

  const testConnector = async (channel: "slack" | "notion" | "zapier") => {
    setBusy(true);
    setMessage(null);
    try {
      await persist(draft);
      await testIntegrationConnector(channel);
      setMessage(
        channel === "notion"
          ? "Notion credentials saved — use Share on a note to verify."
          : `Test message sent to ${channel}.`,
      );
    } catch (e) {
      setMessage(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  const connectorConnected = (id: ConnectorId) => {
    switch (id) {
      case "calendar":
        return calendar.status?.connected ?? false;
      case "slack":
        return draft.slack_webhook_url.trim().length > 0;
      case "notion":
        return (
          draft.notion_integration_token.trim().length > 0 &&
          draft.notion_database_id.trim().length > 0
        );
      case "zapier":
        return draft.zapier_webhook_url.trim().length > 0;
      default:
        return draft.zapier_webhook_url.trim().length > 0;
    }
  };

  return (
    <div className="connectors-shell">
      <header className="connectors-head">
        <div>
          <p className="connectors-kicker">Connectors</p>
          <h2 className="connectors-title">Share when you&apos;re ready</h2>
          <p className="muted connectors-lead">
            Granola-style destinations—Slack, Notion, Zapier, and calendar sync. Credentials stay in
            your local database; nothing leaves your Mac until you post.
          </p>
        </div>
        <button type="button" onClick={() => void saveDraft()} disabled={busy}>
          Save connectors
        </button>
      </header>

      <div className="connectors-layout">
        <nav className="connectors-nav" aria-label="Integration list">
          <ConnectorTab
            id="calendar"
            label="Google Calendar"
            sub="Briefs & reminders"
            active={active}
            connected={connectorConnected("calendar")}
            onSelect={setActive}
            glyph="◷"
          />
          <ConnectorTab
            id="slack"
            label="Slack"
            sub="Channels & team"
            active={active}
            connected={connectorConnected("slack")}
            onSelect={setActive}
            glyph="#"
          />
          <ConnectorTab
            id="notion"
            label="Notion"
            sub="Database pages"
            active={active}
            connected={connectorConnected("notion")}
            onSelect={setActive}
            glyph="N"
          />
          <ConnectorTab
            id="zapier"
            label="Zapier"
            sub="8,000+ apps"
            active={active}
            connected={connectorConnected("zapier")}
            onSelect={setActive}
            glyph="⚡"
          />
          <ConnectorTab
            id="crm"
            label="CRM via Zapier"
            sub="HubSpot · Attio"
            active={active}
            connected={connectorConnected("crm")}
            onSelect={setActive}
            glyph="↗"
          />
        </nav>

        <div className="connectors-detail panel">
          {active === "calendar" && (
            <>
              <h3>Google Calendar</h3>
              <p className="muted small">
                Upcoming meetings, pre-meeting prompts, and brief context—same rhythm as Granola,
                with OAuth tokens stored on device.
              </p>
              <p className="muted small">
                Status:{" "}
                {calendar.status?.connected
                  ? `Connected${calendar.status.email ? ` as ${calendar.status.email}` : ""}`
                  : calendar.status?.client_id_configured
                    ? "Not connected"
                    : "Add a Google OAuth client ID in Settings → capture"}
              </p>
              <div className="row">
                {!calendar.status?.connected ? (
                  <button
                    type="button"
                    disabled={busy || !calendar.status?.client_id_configured}
                    onClick={() => void calendar.connect()}
                  >
                    Connect Google
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => void calendar.disconnect()}
                  >
                    Disconnect
                  </button>
                )}
                <button
                  type="button"
                  className="secondary"
                  disabled={busy || !calendar.status?.connected}
                  onClick={async () => {
                    await calendar.syncNow();
                    setMessage("Calendar synced.");
                  }}
                >
                  Sync now
                </button>
              </div>
              <p className="muted small mono-wrap">
                Client ID is configured under Settings. Redirect:{" "}
                <code>http://127.0.0.1:14528/oauth2/callback</code>
              </p>
            </>
          )}

          {active === "slack" && (
            <>
              <h3>Slack incoming webhook</h3>
              <p className="muted small">
                Post summaries to a channel—manually from any note, or automatically after Enhance
                notes (Granola auto-post style).
              </p>
              <label>
                Webhook URL
                <input
                  type="password"
                  autoComplete="off"
                  value={draft.slack_webhook_url}
                  onChange={(e) =>
                    setDraft({ ...draft, slack_webhook_url: e.target.value })
                  }
                  placeholder="https://hooks.slack.com/services/…"
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.slack_auto_post_on_enhance}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      slack_auto_post_on_enhance: e.target.checked,
                    })
                  }
                />
                Auto-post after Enhance notes
              </label>
              <button
                type="button"
                className="secondary"
                disabled={busy || !draft.slack_webhook_url.trim()}
                onClick={() => void testConnector("slack")}
              >
                Send test message
              </button>
            </>
          )}

          {active === "notion" && (
            <>
              <h3>Notion database</h3>
              <p className="muted small">
                Save enhanced notes as pages in your workspace. Create an internal integration at
                notion.so/my-integrations and share a database with it.
              </p>
              <label>
                Integration token
                <input
                  type="password"
                  autoComplete="off"
                  value={draft.notion_integration_token}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      notion_integration_token: e.target.value,
                    })
                  }
                  placeholder="secret_…"
                />
              </label>
              <label>
                Database ID
                <input
                  value={draft.notion_database_id}
                  onChange={(e) =>
                    setDraft({ ...draft, notion_database_id: e.target.value })
                  }
                  placeholder="32-character database id"
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.notion_auto_post_on_enhance}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      notion_auto_post_on_enhance: e.target.checked,
                    })
                  }
                />
                Auto-save after Enhance notes
              </label>
              <button
                type="button"
                className="secondary"
                disabled={
                  busy ||
                  !draft.notion_integration_token.trim() ||
                  !draft.notion_database_id.trim()
                }
                onClick={() => void testConnector("notion")}
              >
                Validate credentials
              </button>
            </>
          )}

          {active === "zapier" && (
            <>
              <h3>Zapier catch hook</h3>
              <p className="muted small">
                Fire a JSON payload to any Zap—Slack, HubSpot, Salesforce, Linear, and the rest of
                the Granola + Zapier catalog.
              </p>
              <label>
                Webhook URL
                <input
                  type="password"
                  autoComplete="off"
                  value={draft.zapier_webhook_url}
                  onChange={(e) =>
                    setDraft({ ...draft, zapier_webhook_url: e.target.value })
                  }
                  placeholder="https://hooks.zapier.com/hooks/catch/…"
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.zapier_auto_post_on_enhance}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      zapier_auto_post_on_enhance: e.target.checked,
                    })
                  }
                />
                Auto-send after Enhance notes
              </label>
              <button
                type="button"
                className="secondary"
                disabled={busy || !draft.zapier_webhook_url.trim()}
                onClick={() => void testConnector("zapier")}
              >
                Send test payload
              </button>
            </>
          )}

          {active === "crm" && (
            <>
              <h3>CRM &amp; revenue tools</h3>
              <p className="muted small">
                Granola ships native HubSpot, Attio, and Affinity connectors. NoteStack routes the
                same data through Zapier so nothing touches a vendor cloud until you wire the Zap.
              </p>
              <ul className="crm-routing-list">
                {CRM_HINTS.map((row) => (
                  <li key={row.id}>
                    <strong>{row.label}</strong>
                    <span className="muted small">{row.hint}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">
                Tip: trigger on <code>event: meeting_notes_enhanced</code> in the JSON body—fields
                include summary, tasks, markdown, and transcript excerpt.
              </p>
            </>
          )}
        </div>
      </div>

      {message && <p className="status connectors-status">{message}</p>}
    </div>
  );
}

function ConnectorTab({
  id,
  label,
  sub,
  glyph,
  active,
  connected,
  onSelect,
}: {
  id: ConnectorId;
  label: string;
  sub: string;
  glyph: string;
  active: ConnectorId;
  connected: boolean;
  onSelect: (id: ConnectorId) => void;
}) {
  return (
    <button
      type="button"
      className={`connectors-tab${active === id ? " active" : ""}`}
      onClick={() => onSelect(id)}
    >
      <span className="connectors-glyph" aria-hidden>
        {glyph}
      </span>
      <span className="connectors-tab-text">
        <span className="connectors-tab-label">{label}</span>
        <span className="muted small">{sub}</span>
      </span>
      <span
        className={`connectors-dot${connected ? " on" : ""}`}
        title={connected ? "Configured" : "Not configured"}
      />
    </button>
  );
}