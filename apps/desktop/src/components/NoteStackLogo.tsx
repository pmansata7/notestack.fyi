type NoteStackLogoProps = {
  className?: string;
  height?: number;
};

const LOGO_ASPECT = 1610 / 400;

export function NoteStackLogo({ className = "", height = 28 }: NoteStackLogoProps) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <img
      src="/brand/notestack-logo-horizontal.png"
      alt="NoteStack"
      width={width}
      height={height}
      className={className}
      decoding="async"
    />
  );
}
