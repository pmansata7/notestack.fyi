import { useEffect, useRef, useState } from "react";
import {
  autoShareMeetingNote,
  buildMeetingExportMarkdown,
  shareMeetingNote,
} from "../api";
import { formatInvokeError } from "../lib/errors";
import { normalizeSettings } from "../lib/settings";
import type { AppSettings, ShareChannel, Transcript } from "../types";

interface Props {
  transcript: Transcript;
  settings: AppSettings;
  onMessage: (msg: string | null) => void;
  disabled?: boolean;
}

const CHANNELS: { id: ShareChannel; label: string; hint: string }[] = [
  { id: "slack", label: "Slack", hint: "Post summary to channel" },
  { id: "notion", label: "Notion", hint: "New database page" },
  { id: "zapier", label: "Zapier", hint: "JSON to your Zap" },
];

function channelReady(settings: AppSettings, id: ShareChannel): boolean {
  const s = normalizeSettings(settings);
  if (id === "slack") return s.slack_webhook_url.trim().length > 0;
  if (id === "notion") {
    return (
      s.notion_integration_token.trim().length > 0 &&
      s.notion_database_id.trim().length > 0
    );
  }
  return s.zapier_webhook_url.trim().length > 0;
}

export function ShareMenu({ transcript, settings, onMessage, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const share = async (channel: ShareChannel) => {
    setBusy(true);
    onMessage(null);
    try {
      await shareMeetingNote(transcript.id, channel);
      onMessage(`Shared to ${channel}.`);
      setOpen(false);
    } catch (e) {
      onMessage(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  const copyMarkdown = async () => {
    setBusy(true);
    onMessage(null);
    try {
      const md = await buildMeetingExportMarkdown(transcript.id);
      await navigator.clipboard.writeText(md);
      onMessage("Copied markdown to clipboard.");
      setOpen(false);
    } catch (e) {
      onMessage(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="share-menu" ref={rootRef}>
      <button
        type="button"
        className="secondary share-trigger"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Share
      </button>
      {open && (
        <div className="share-popover" role="menu">
          <p className="share-popover-title">Destinations</p>
          {CHANNELS.map((ch) => {
            const ready = channelReady(settings, ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                role="menuitem"
                className="share-item"
                disabled={!ready || busy}
                onClick={() => void share(ch.id)}
              >
                <span>
                  <strong>{ch.label}</strong>
                  <span className="muted small">{ch.hint}</span>
                </span>
                {!ready && <span className="share-badge">Set up in Connectors</span>}
              </button>
            );
          })}
          <button
            type="button"
            role="menuitem"
            className="share-item"
            disabled={busy}
            onClick={() => void copyMarkdown()}
          >
            <span>
              <strong>Copy markdown</strong>
              <span className="muted small">Full note for email or docs</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export async function runAutoShareIfConfigured(
  transcriptId: string,
  onMessage: (msg: string) => void,
): Promise<void> {
  const results = await autoShareMeetingNote(transcriptId);
  const summary = results
    .filter((r) => r.ok)
    .map((r) => r.message)
    .join(" ");
  if (summary) onMessage(summary);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    onMessage(failed.map((f) => `${f.channel}: ${f.message}`).join(" · "));
  }
}