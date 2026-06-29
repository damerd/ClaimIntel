import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, ArrowRight } from "lucide-react";

export default function ClaimReadinessCard({ score, claimName, onViewDetails }) {
  const displayScore = score != null ? `${Math.round(score)}%` : "—";

  return (
    <Card
      className="shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all max-w-sm"
      onClick={onViewDetails}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Claim Readiness</p>
              <p className="text-2xl font-bold">{displayScore}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Overall Readiness</p>
            <span className="text-xs font-medium text-primary hover:underline mt-1 flex items-center gap-1">
              View Details <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
        {claimName && (
          <p className="text-xs text-muted-foreground mt-3 truncate">{claimName}</p>
        )}
      </CardContent>
    </Card>
  );
}