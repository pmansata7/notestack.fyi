import { useCallback, useRef, useState } from "react";
import { createTranscript, saveRecordingAudio, updateTranscript } from "../api";
import type { Transcript } from "../types";

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
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useRecording(onSaved: (t: Transcript) => void) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<Transcript | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
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

  const start = useCallback(async () => {
    setError(null);
    setLiveText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const transcript = await createTranscript();
      transcriptRef.current = transcript;
      setCurrentId(transcript.id);

      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);

      const SpeechRecognition = getSpeechRecognition();
      if (SpeechRecognition) {
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
            return interim ? `${line}\n${interim}` : line;
          });
        };
        recognition.onerror = () => {
          /* live STT optional */
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      startRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startRef.current);
      }, 250);
      setRecording(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Microphone access failed",
      );
    }
  }, []);

  const stop = useCallback(async () => {
    setRecording(false);
    stopTimer();
    stopRecognition();

    const recorder = mediaRecorderRef.current;
    const transcript = transcriptRef.current;
    if (!recorder || !transcript) return;

    const duration = Date.now() - startRef.current;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
    const buffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const ext = recorder.mimeType.includes("webm") ? "webm" : "audio";

    const text = liveText.trim();
    let updated = await updateTranscript({
      id: transcript.id,
      transcript_text: text,
      duration_ms: duration,
    });
    updated = await saveRecordingAudio(transcript.id, base64, ext);
    onSaved(updated);
    setCurrentId(null);
    transcriptRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, [liveText, onSaved]);

  return {
    recording,
    elapsedMs,
    liveText,
    setLiveText,
    error,
    currentId,
    start,
    stop,
  };
}
