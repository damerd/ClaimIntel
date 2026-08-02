import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useAdminMode } from "@/lib/useAdminMode";

export const BETA_REVIEW_LIMIT = 2;

export function useBetaUsage() {
  const { user } = useAuth();
  const { adminMode } = useAdminMode(user);
  const { data: reviews = [] } = useQuery({
    queryKey: ["betaUsageReviews"],
    queryFn: () => base44.entities.ClaimReview.list("-created_date", 50),
  });
  const used = reviews.length;
  const remaining = Math.max(0, BETA_REVIEW_LIMIT - used);
  const exhausted = remaining === 0 && !adminMode;
  return { used, remaining, exhausted, adminMode };
}

export default function BetaUsageIndicator() {
  const { remaining, exhausted, adminMode } = useBetaUsage();

  if (adminMode) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-accent/10 border-accent/30">
        <ShieldCheck className="w-3.5 h-3.5 text-accent-foreground" />
        <span className="text-xs font-medium text-accent-foreground">Admin Mode — Unlimited Access</span>
      </div>
    );
  }

  const config = exhausted
    ? { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", label: "0 of 2 — Upgrade Required" }
    : remaining === 1
    ? { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "1 of 2" }
    : { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "2 of 2" };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${config.bg}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.text}`}>Beta Reviews Remaining: {config.label}</span>
      {exhausted && (
        <Link to="/pricing" className="ml-1 text-xs font-semibold text-red-700 underline hover:text-red-800">
          Upgrade
        </Link>
      )}
    </div>
  );
}