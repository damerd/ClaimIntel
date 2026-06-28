import ClaimIntelMark from "./ClaimIntelMark";

/**
 * ClaimIntel Full Logo — Layered C mark + wordmark.
 *
 * Wordmark: "Claim" in dark gray, "Intel" in navy (light variant: light gray + white).
 * Optional tagline: "Smarter Claims. Better Decisions."
 *
 * variant="default" → for light backgrounds
 * variant="light"   → for dark/navy backgrounds
 */
export default function ClaimIntelLogo({
  size = 36,
  showTagline = false,
  variant = "default",
  className = "",
  tagline = "Smarter Claims. Better Decisions.",
}) {
  const claimColor = variant === "light" ? "#f1f5f9" : "#334155";
  const intelColor = variant === "light" ? "#ffffff" : "#1A2744";
  const taglineClass = variant === "light" ? "text-white/50" : "text-muted-foreground";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ClaimIntelMark size={size} variant={variant} className="shrink-0" />
      <div className="flex flex-col leading-none">
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: `${size * 0.5}px`, color: claimColor }}
        >
          Claim<span style={{ color: intelColor }}>Intel</span>
        </span>
        {showTagline && (
          <span className={`${taglineClass} mt-1`} style={{ fontSize: `${size * 0.22}px` }}>
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}