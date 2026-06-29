import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ClipboardCheck, Circle, AlertCircle } from "lucide-react";

const STATUS_STYLES = {
  "Complete": "text-emerald-600",
  "In Progress": "text-blue-600",
  "Needs Records": "text-amber-600",
  "Partial": "text-orange-600",
  "Not Started": "text-slate-400",
};

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ClaimReadinessPanel({ open, onOpenChange, review }) {
  if (!review) return null;

  const categories = parseJsonArray(review.readiness_categories);
  const missingRequirements = parseJsonArray(review.missing_requirements);
  const score = review.readiness_score;
  const recommendation = review.readiness_recommendation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Claim Readiness
          </SheetTitle>
          <SheetDescription>
            {review.claim_name || "Claim"} — {review.claim_number || ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overall Readiness */}
          <div className="text-center py-6 border rounded-lg bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Claim Readiness</p>
            <p className="text-5xl font-bold text-primary mt-2">
              {score != null ? `${Math.round(score)}%` : "—"}
            </p>
          </div>

          {/* Readiness Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Readiness Categories</h3>
            <div className="space-y-1">
              {categories.length > 0 ? (
                categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className={`text-sm font-semibold ${STATUS_STYLES[cat.status] || "text-muted-foreground"}`}>
                      {cat.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No category data available.</p>
              )}
            </div>
          </div>

          {/* Missing Requirements */}
          {missingRequirements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Missing Requirements</h3>
              <div className="space-y-2">
                {missingRequirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 italic">
                Informational during Beta. Designed to evolve into workflow tasks in future releases.
              </p>
            </div>
          )}

          {/* AI Recommendation */}
          {recommendation && (
            <div className="border rounded-lg p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">AI Recommendation</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}