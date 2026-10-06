import { useCallback, useRef, useState } from "react";
import {
  createTranscript,
  enhanceNotes,
  generateInstantSummary,
  saveRecordingAudio,
  stripAudioAfterTranscribe,
  transcribeAudioBase64,
  transcribeRecordingAudio,
  updateTranscript,
} from "../api";
import { isTauriDesktop } from "../lib/platform";
import {
  createWavCapture,
  MIN_LIVE_WAV_BYTES,
  type WavCaptureHandle,
} from "../lib/wavCapture";
import type { AppSettings, Transcript } from "../types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (isTauriDesktop()) return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const LIVE_OLLAMA_INTERVAL_MS = 10_000;

export type LiveSttMode = "web" | "ollama" | "none";

export function useRecording(
  settings: AppSettings,
  onSaved: (t: Transcript) => void,
) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState<string | undefined>();
  const [transcribing, setTranscribing] = useState(false);
  const [liveSttMode, setLiveSttMode] = useState<LiveSttMode>("none");
  const [liveOllamaBusy, setLiveOllamaBusy] = useState(false);
  const liveOllamaBusyRef = useRef(false);

  const wavCaptureRef = useRef<WavCaptureHandle | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const liveOllamaTimerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<Transcript | null>(null);
  const liveTextRef = useRef("");
  const manualNotesRef = useRef("");
  const liveOllamaSampleCursorRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopLiveOllamaTimer = () => {
    if (liveOllamaTimerRef.current !== null) {
      window.clearInterval(liveOllamaTimerRef.current);
      liveOllamaTimerRef.current = null;
    }
  };

  const stopRecognition = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  };

  const appendLiveTranscript = (piece: string) => {
    const trimmed = piece.trim();
    if (!trimmed) return;
    setLiveText((prev) => {
      const next = prev.trim() ? `${prev.trim()}\n${trimmed}` : trimmed;
      liveTextRef.current = next;
      return next;
    });
  };

  const runLiveOllamaChunk = async () => {
    const capture = wavCaptureRef.current;
    if (!capture || liveOllamaBusyRef.current) return;

    const { blob, toSampleIndex } = capture.getWavBlobSince(
      liveOllamaSampleCursorRef.current,
    );
    if (blob.size < MIN_LIVE_WAV_BYTES) return;

    liveOllamaBusyRef.current = true;
    setLiveOllamaBusy(true);
    try {
      const buffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const text = await transcribeAudioBase64(
        base64,
        settingsRef.current.transcription_model,
      );
      liveOllamaSampleCursorRef.current = toSampleIndex;
      appendLiveTranscript(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("404") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("model")
      ) {
        setError(
          `Live transcription needs a speech model. Run ollama pull ${settingsRef.current.transcription_model || "gemma4:e4b"} in Terminal, or change Settings → Transcription model.`,
        );
      }
    } finally {
      liveOllamaBusyRef.current = false;
      setLiveOllamaBusy(false);
    }
  };

  const startLiveOllamaLoop = () => {
    liveOllamaSampleCursorRef.current = 0;
    stopLiveOllamaTimer();
    liveOllamaTimerRef.current = window.setInterval(() => {
      void runLiveOllamaChunk();
    }, LIVE_OLLAMA_INTERVAL_MS);
    window.setTimeout(() => void runLiveOllamaChunk(), 4_000);
  };

  const start = useCallback(async (title?: string): Promise<string | null> => {
    setError(null);
    setLiveText("");
    setManualNotes("");
    liveTextRef.current = "";
    manualNotesRef.current = "";
    setPendingTitle(title);
    setLiveSttMode("none");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const wavCapture = await createWavCapture(stream);
      wavCaptureRef.current = wavCapture;

      const transcript = await createTranscript(title);
      transcriptRef.current = transcript;
      setCurrentId(transcript.id);

      const SpeechRecognition = getSpeechRecognition();
      const useOllamaLive =
        isTauriDesktop() && settingsRef.current.auto_transcribe_on_stop;

      if (SpeechRecognition) {
        setLiveSttMode("web");
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += piece;
            else interim += piece;
          }
          setLiveText((prev) => {
            const base = prev.split("\n").filter(Boolean);
            if (final) base.push(final.trim());
            const line = base.join("\n");
            const next = interim ? `${line}\n${interim}` : line;
            liveTextRef.current = next;
            return next;
          });
        };
        recognition.onerror = () => {
          /* live STT optional */
        };
        recognition.start();
        recognitionRef.current = recognition;
      } else if (useOllamaLive) {
        setLiveSttMode("ollama");
        startLiveOllamaLoop();
      } else {
        setLiveSttMode("none");
      }

      startRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startRef.current);
      }, 250);
      setRecording(true);
      return transcript.id;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Microphone access failed",
      );
      return null;
    }
  }, []);

  const stop = useCallback(async () => {
    setRecording(false);
    stopTimer();
    stopLiveOllamaTimer();
    stopRecognition();

    const wavCapture = wavCaptureRef.current;
    const transcript = transcriptRef.current;
    if (!wavCapture || !transcript) return;

    const duration = Date.now() - startRef.current;
    let text = liveTextRef.current.trim();
    const notes = manualNotesRef.current.trim();

    if (liveSttMode === "ollama") {
      await runLiveOllamaChunk();
      text = liveTextRef.current.trim();
    }

    const wavBlob = wavCapture.getFullWavBlob();
    wavCapture.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    wavCaptureRef.current = null;

    const buffer = await wavBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    let updated = await updateTranscript({
      id: transcript.id,
      transcript_text: text,
      manual_notes: notes,
      duration_ms: duration,
      title: pendingTitle,
    });
    updated = await saveRecordingAudio(transcript.id, base64, "wav");

    const shouldTranscribe =
      settings.auto_transcribe_on_stop &&
      wavBlob.size > 0 &&
      !text.trim();
    if (shouldTranscribe) {
      setTranscribing(true);
      try {
        updated = await transcribeRecordingAudio(
          transcript.id,
          settings.transcription_model,
        );
        liveTextRef.current = updated.transcript_text;
        setLiveText(updated.transcript_text);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Transcription failed";
        setError(
          `${msg}. Install an Ollama speech model (e.g. ollama pull gemma4:e4b) and check Settings.`,
        );
      } finally {
        setTranscribing(false);
      }
    }

    const finalText = updated.transcript_text.trim();

    if (settings.auto_instant_summary && finalText) {
      try {
        updated = await generateInstantSummary(
          transcript.id,
          settings.default_model,
        );
      } catch {
        /* optional */
      }
    }

    if (settings.auto_enhance_on_stop && (finalText || notes)) {
      try {
        updated = await enhanceNotes(transcript.id, settings.default_model);
      } catch {
        /* optional */
      }
    }

    if (settings.delete_audio_after_transcribe) {
      try {
        updated = await stripAudioAfterTranscribe(transcript.id);
      } catch {
        /* optional */
      }
    }

    onSaved(updated);
    setCurrentId(null);
    setPendingTitle(undefined);
    setLiveSttMode("none");
    transcriptRef.current = null;
  }, [onSaved, pendingTitle, settings, liveSttMode]);

  const setManualNotesTracked = (v: string) => {
    manualNotesRef.current = v;
    setManualNotes(v);
  };

  const setLiveTextTracked = (v: string) => {
    liveTextRef.current = v;
    setLiveText(v);
  };

  return {
    recording,
    transcribing,
    elapsedMs,
    liveText,
    setLiveText: setLiveTextTracked,
    manualNotes,
    setManualNotes: setManualNotesTracked,
    error,
    currentId,
    liveSttMode,
    liveOllamaBusy,
    start,
    stop,
  };
}
