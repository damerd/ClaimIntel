/**
 * ClaimIntel Logo Mark — Abstract layered letter C.
 * Three concentric C-shaped arcs symbolize bringing together multiple
 * sources of claim information into a single intelligent analysis.
 *
 * Colors:
 *   Outer  — Navy (primary)
 *   Middle — Slate (secondary)
 *   Inner  — Teal (accent)
 *
 * variant="default" → navy/slate/teal on transparent (light backgrounds)
 * variant="light"   → white/light-slate/teal on transparent (dark backgrounds)
 */
export default function ClaimIntelMark({ size = 36, className = "", variant = "default" }) {
  const outer = variant === "light" ? "#ffffff" : "#1A2744";
  const middle = variant === "light" ? "#cbd5e1" : "#64748B";
  const inner = "#0D9488";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ClaimIntel"
    >
      <path d="M39 9 A21 21 0 1 0 39 39" stroke={outer} strokeWidth="4" strokeLinecap="round" />
      <path d="M34 14 A14 14 0 1 0 34 34" stroke={middle} strokeWidth="4" strokeLinecap="round" />
      <path d="M29 19 A7 7 0 1 0 29 29" stroke={inner} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}