/** Model refusals / empty STT — should not be shown or block final transcribe. */
export function isJunkTranscriptionLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (!lower) return true;
  return (
    lower.includes("cannot transcribe") ||
    lower.includes("no audio was provided") ||
    lower.includes("please provide the audio") ||
    lower.includes("i'm unable to transcribe") ||
    lower.includes("unable to transcribe")
  );
}

export function stripJunkTranscript(text: string): string {
  return text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !isJunkTranscriptionLine(l))
    .join("\n");
}

export function isUsableLiveTranscript(text: string): boolean {
  return stripJunkTranscript(text).length > 0;
}

export type TranscriptSegment = {
  speaker: string;
  body: string;
};

/** Parse "Speaker 1: hello" lines for display. */
export function parseSpeakerSegments(text: string): TranscriptSegment[] {
  const cleaned = stripJunkTranscript(text);
  if (!cleaned) return [];

  const lines = cleaned.split(/\n/);
  const segments: TranscriptSegment[] = [];
  const speakerRe = /^((?:speaker\s*\d+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?))\s*:\s*(.*)$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(speakerRe);
    if (match) {
      segments.push({
        speaker: match[1].replace(/\s+/g, " "),
        body: match[2].trim(),
      });
    } else if (segments.length > 0) {
      const last = segments[segments.length - 1];
      last.body = `${last.body} ${trimmed}`.trim();
    } else {
      segments.push({ speaker: "Transcript", body: trimmed });
    }
  }
  return segments;
}

export function hasSpeakerLabels(text: string): boolean {
  return /^speaker\s*\d+\s*:/im.test(text) || parseSpeakerSegments(text).some(
    (s) => s.speaker.toLowerCase().startsWith("speaker"),
  );
}
