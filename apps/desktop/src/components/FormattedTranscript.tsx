import { parseSpeakerSegments, stripJunkTranscript } from "../lib/transcriptText";

interface Props {
  text: string;
  compact?: boolean;
}

export function FormattedTranscript({ text, compact }: Props) {
  const cleaned = stripJunkTranscript(text);
  const segments = parseSpeakerSegments(cleaned);

  if (!cleaned) {
    return (
      <p className="transcript-placeholder muted">
        {compact ? "Listening…" : "Transcript will appear here as you speak."}
      </p>
    );
  }

  if (segments.length <= 1 && segments[0]?.speaker === "Transcript") {
    return <p className="transcript-plain">{cleaned}</p>;
  }

  return (
    <div className={`transcript-thread${compact ? " transcript-thread--compact" : ""}`}>
      {segments.map((seg, i) => (
        <article key={i} className="transcript-turn">
          <span className="transcript-speaker">{seg.speaker}</span>
          <p className="transcript-body">{seg.body}</p>
        </article>
      ))}
    </div>
  );
}
