import { useCallback, useEffect, useRef, useState } from "react";
import {
  googleCalendarConnect,
  googleCalendarDisconnect,
  googleCalendarStatus,
  googleCalendarSync,
} from "../api";
import { formatInvokeError } from "../lib/errors";
import type { AppSettings, GoogleCalendarStatus } from "../types";

export function useGoogleCalendar(
  settings: AppSettings,
  onSettingsSynced: (s: AppSettings) => void,
) {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSyncedRef = useRef(onSettingsSynced);
  onSyncedRef.current = onSettingsSynced;

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await googleCalendarStatus());
    } catch (e) {
      setError(formatInvokeError(e));
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus, settings.google_oauth_client_id]);

  useEffect(() => {
    if (!status?.connected) {
      return;
    }
    const sync = async () => {
      try {
        const next = await googleCalendarSync();
        onSyncedRef.current(next);
        setStatus(await googleCalendarStatus());
      } catch (e) {
        setError(formatInvokeError(e));
      }
    };
    void sync();
    const interval = window.setInterval(() => void sync(), 5 * 60_000);
    return () => window.clearInterval(interval);
  }, [status?.connected]);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await googleCalendarConnect());
      const next = await googleCalendarSync();
      onSyncedRef.current(next);
      setStatus(await googleCalendarStatus());
    } catch (e) {
      setError(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await googleCalendarDisconnect());
    } catch (e) {
      setError(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await googleCalendarSync();
      onSyncedRef.current(next);
      setStatus(await googleCalendarStatus());
    } catch (e) {
      setError(formatInvokeError(e));
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    busy,
    error,
    connect,
    disconnect,
    syncNow,
    refreshStatus,
  };
}
