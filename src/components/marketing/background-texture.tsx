import { brandColors } from "@/config/site";

const BLOBS = [
  { modifier: "background-texture__blob--sky", color: brandColors.accent[300], size: 560 },
  { modifier: "background-texture__blob--navy", color: brandColors.navy[900], size: 620 },
] as const;

/**
 * Very low-opacity, heavily blurred two-tone blue wash behind the entire
 * marketing site (mounted once in (marketing)/layout.tsx, not per-page) —
 * a light sky blue and the brand's dark navy. Fixed to the viewport so it
 * reads as a continuous texture rather than being confined to one
 * section; content sections with their own solid background simply sit
 * on top of it. Pure CSS drift (see globals.css .background-texture*
 * rules) — respects prefers-reduced-motion and is simplified on mobile.
 * Decorative only, so it's aria-hidden.
 */
export function BackgroundTexture() {
  return (
    <div className="background-texture" aria-hidden="true">
      {BLOBS.map((blob) => (
        <span
          key={blob.modifier}
          className={`background-texture__blob ${blob.modifier}`}
          style={{ background: blob.color, width: blob.size, height: blob.size }}
        />
      ))}
    </div>
  );
}
