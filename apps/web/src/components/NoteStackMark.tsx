import type { CSSProperties } from 'react'

type NoteStackMarkProps = {
  className?: string
  size?: number
  /** Light UI surfaces use stroked bars; dark surfaces use solid white bars. */
  variant?: 'light' | 'dark'
}

export function NoteStackMark({ className = '', size = 28, variant = 'light' }: NoteStackMarkProps) {
  const isDark = variant === 'dark'

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
              '--notestack-bar': '#ffffff',
              '--notestack-bar-stroke': 'transparent',
              '--notestack-accent': '#b59dff',
            } as CSSProperties)
          : ({
              '--notestack-bar': '#f4f6fa',
              '--notestack-bar-stroke': '#e2e8f0',
              '--notestack-accent': '#9580ff',
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
  )
}
