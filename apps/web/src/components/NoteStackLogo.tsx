import { NoteStackMark } from './NoteStackMark'

type NoteStackLogoProps = {
  className?: string
  /** Overall logo height in pixels (mark scales to match). */
  height?: number
  variant?: 'light' | 'dark'
}

export function NoteStackLogo({
  className = '',
  height = 32,
  variant = 'light',
}: NoteStackLogoProps) {
  const wordmarkColor =
    variant === 'dark' ? 'var(--color-ns-on-dark, #faf8f3)' : 'var(--color-ns-text, #18181b)'
  const wordmarkSize = Math.round(height * 0.58)

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2.5 ${className}`}
      role="img"
      aria-label="NoteStack"
    >
      <NoteStackMark size={height} variant={variant} className="shrink-0" />
      <span
        className="truncate font-sans font-bold tracking-[-0.04em]"
        style={{
          fontSize: wordmarkSize,
          lineHeight: 1,
          color: wordmarkColor,
        }}
      >
        NoteStack
      </span>
    </span>
  )
}