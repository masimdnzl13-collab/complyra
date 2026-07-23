import { brandColors } from "@/config/site";

const BLOBS = [
  { modifier: "hero-aurora__blob--a", color: brandColors.warning.DEFAULT, size: 480 },
  { modifier: "hero-aurora__blob--b", color: brandColors.success.DEFAULT, size: 520 },
  { modifier: "hero-aurora__blob--c", color: brandColors.accent.DEFAULT, size: 440 },
] as const;

/**
 * Three large, heavily blurred color washes drifting slowly behind the dark
 * hero — "three obligation layers" (transparency/amber, completed/green,
 * platform/blue) bleeding into one another. Pure CSS (see globals.css
 * .hero-aurora* rules) — no animation library, respects
 * prefers-reduced-motion, and is simplified on mobile for performance.
 * Decorative only, so it's aria-hidden.
 */
export function HeroAurora() {
  return (
    <div className="hero-aurora" aria-hidden="true">
      {BLOBS.map((blob) => (
        <span
          key={blob.modifier}
          className={`hero-aurora__blob ${blob.modifier}`}
          style={{ background: blob.color, width: blob.size, height: blob.size }}
        />
      ))}
    </div>
  );
}
