import { Rocket } from "lucide-react";

export default function BetaBanner() {
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl px-5 py-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Rocket className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold flex items-center gap-2">
          ClaimIntel Beta
          <span className="text-[10px] uppercase tracking-wider bg-accent/20 px-1.5 py-0.5 rounded-full">Early Access</span>
        </p>
        <p className="text-xs mt-0.5 leading-relaxed text-primary-foreground/80">
          Experience the full power of ClaimIntel with two complimentary AI-powered claim reviews. We're actively refining the platform based on user feedback before our official launch.
        </p>
      </div>
    </div>
  );
}