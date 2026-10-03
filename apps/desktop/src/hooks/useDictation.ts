import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Fireflies Talk–style hold-to-dictate: copies cleaned text to clipboard on release. */
export function useDictation(enabled: boolean) {
  const [listening, setListening] = useState(false);
  const [lastText, setLastText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bufferRef = useRef("");

  const clean = (raw: string) =>
    raw
      .replace(/\b(uh|um|like)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setListening(false);
    const text = clean(bufferRef.current);
    if (text) {
      setLastText(text);
      void navigator.clipboard.writeText(text);
    }
    bufferRef.current = "";
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    bufferRef.current = "";
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          chunk += event.results[i][0].transcript;
        }
      }
      if (chunk) bufferRef.current += ` ${chunk}`;
    };
    rec.onerror = () => stop();
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }, [enabled, stop]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Fn" || (e.ctrlKey && e.metaKey)) {
        if (!listening) start();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Fn" || (e.ctrlKey && e.metaKey)) {
        if (listening) stop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled, listening, start, stop]);

  return { listening, lastText, start, stop };
}
