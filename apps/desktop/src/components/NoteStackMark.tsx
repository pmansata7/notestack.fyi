import type { CSSProperties } from "react";

type NoteStackMarkProps = {
  className?: string;
  size?: number;
  variant?: "light" | "dark";
};

export function NoteStackMark({
  className = "",
  size = 28,
  variant = "light",
}: NoteStackMarkProps) {
  const isDark = variant === "dark";

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={
        isDark
          ? ({
              "--notestack-bar": "#faf8f3",
              "--notestack-bar-stroke": "transparent",
              "--notestack-accent": "#2dd4bf",
            } as CSSProperties)
          : ({
              "--notestack-bar": "#f4f4f5",
              "--notestack-bar-stroke": "#e4e4e7",
              "--notestack-accent": "#0f766e",
            } as CSSProperties)
      }
    >
      <path
        d="M7 9h31.2l3.8 7.2H10.8L7 9z"
        fill="var(--notestack-bar)"
        stroke="var(--notestack-bar-stroke)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M7 20h12.4l3.8 7.2H7V20z" fill="var(--notestack-accent)" />
      <path
        d="M19.4 20h19l3.6 7.2H23.2L19.4 20z"
        fill="var(--notestack-bar)"
        stroke="var(--notestack-bar-stroke)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M7 31h31.2l3.8 7.2H10.8L7 31z"
        fill="var(--notestack-bar)"
        stroke="var(--notestack-bar-stroke)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
