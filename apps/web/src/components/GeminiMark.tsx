import { useId } from 'react'

type GeminiMarkProps = {
  className?: string
  size?: number
}

/** NoteStack mark: stacked note pages for strong contrast on light backgrounds. */
export function GeminiMark({ className = '', size = 28 }: GeminiMarkProps) {
  const id = useId().replace(/:/g, '')
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
        <linearGradient id={`${id}-page`} x1="6" y1="6" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1967d2" />
          <stop offset="1" stopColor="#0b57d0" />
        </linearGradient>
      </defs>
      <rect x="4" y="9" width="14" height="16" rx="2.5" fill="#c2d7f7" />
      <rect x="6" y="7" width="14" height="16" rx="2.5" fill="#8ab4f8" />
      <rect x="8" y="5" width="14" height="16" rx="2.5" fill={`url(#${id}-page)`} />
      <path
        d="M11.5 10.5h7M11.5 13.5h7M11.5 16.5h4.5"
        stroke="white"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function geminiGradientTextClass() {
  return 'bg-[linear-gradient(90deg,#0b57d0_0%,#1967d2_50%,#7c3aed_100%)] bg-clip-text text-transparent'
}
