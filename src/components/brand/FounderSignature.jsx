import { APPLICATION_IDENTITY } from "@/config/applicationIdentity";

export default function FounderSignature({ compact = false, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={`${APPLICATION_IDENTITY.signature}, ${APPLICATION_IDENTITY.founderTitle}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-bold tracking-[0.12em] text-foreground">
        DD
      </div>
      <div className="leading-tight">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {APPLICATION_IDENTITY.signature}
        </p>
        <p className="text-[11px] font-semibold text-foreground">{APPLICATION_IDENTITY.founderTitle}</p>
        {!compact && (
          <p className="text-[10px] text-muted-foreground">{APPLICATION_IDENTITY.positioning}</p>
        )}
      </div>
    </div>
  );
}
