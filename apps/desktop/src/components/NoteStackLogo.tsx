import { NoteStackMark } from "./NoteStackMark";

type NoteStackLogoProps = {
  className?: string;
  height?: number;
  variant?: "light" | "dark";
};

export function NoteStackLogo({
  className = "",
  height = 28,
  variant = "light",
}: NoteStackLogoProps) {
  const wordmarkColor = variant === "dark" ? "#faf8f3" : "#18181b";
  const wordmarkSize = Math.round(height * 0.58);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2.5 ${className}`}
      role="img"
      aria-label="NoteStack"
    >
      <NoteStackMark size={height} variant={variant} className="shrink-0" />
      <span
        className="truncate font-bold tracking-[-0.04em]"
        style={{
          fontSize: wordmarkSize,
          lineHeight: 1,
          color: wordmarkColor,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        NoteStack
      </span>
    </span>
  );
}