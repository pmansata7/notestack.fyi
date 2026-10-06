type NoteStackLogoProps = {
  className?: string
  /** Render height in pixels; width scales with the horizontal lockup aspect ratio. */
  height?: number
}

const LOGO_ASPECT = 1610 / 400

export function NoteStackLogo({ className = '', height = 32 }: NoteStackLogoProps) {
  const width = Math.round(height * LOGO_ASPECT)
  return (
    <img
      src="/brand/notestack-logo-horizontal.png"
      alt="NoteStack"
      width={width}
      height={height}
      className={className}
      decoding="async"
    />
  )
}
