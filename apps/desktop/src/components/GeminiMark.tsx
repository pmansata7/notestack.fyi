import { useId } from "react";

type GeminiMarkProps = {
  className?: string
  size?: number
};

export function GeminiMark({ className = "", size = 28 }: GeminiMarkProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="4" y1="24" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.35" stopColor="#9B72CB" />
          <stop offset="0.65" stopColor="#D96570" />
          <stop offset="1" stopColor="#F4B400" />
        </linearGradient>
      </defs>
      <path
        d="M14 2.5L16.8 11.2L25.5 14L16.8 16.8L14 25.5L11.2 16.8L2.5 14L11.2 11.2L14 2.5Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
