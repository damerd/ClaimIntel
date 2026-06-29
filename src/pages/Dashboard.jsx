import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FilePlus, 
  FolderOpen, 
  FileCheck, 
  Clock, 
  TrendingUp,
  ArrowRight,
  FileText
} from "lucide-react";
import StatusBadge from "@/components/claims/StatusBadge";
import DisclaimerBanner from "@/components/claims/DisclaimerBanner";
import BetaBanner from "@/components/claims/BetaBanner";
import BetaUsageIndicator from "@/components/claims/BetaUsageIndicator";
import ClaimReadinessCard from "@/components/claims/ClaimReadinessCard";
import ClaimReadinessPanel from "@/components/claims/ClaimReadinessPanel";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const { showBetaElements } = useUserRole();
  const [readinessOpen, setReadinessOpen] = useState(false);
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["claimReviews"],
    queryFn: () => base44.entities.ClaimReview.list("-created_date", 50),
  });

  const reviewed = reviews.filter((r) => r.status === "reviewed").length;
  const drafts = reviews.filter((r) => r.status === "draft").length;
  const recent = reviews.slice(0, 5);
  const latestReviewed = reviews.find((r) => r.status === "reviewed" && r.readiness_score != null);

  const stats = [
    { label: "Total Reviews", value: reviews.length, icon: FileText, color: "bg-primary/10 text-primary", link: null },
    { label: "Completed", value: reviewed, icon: FileCheck, color: "bg-emerald-50 text-emerald-600", link: "/saved-reviews?status=reviewed" },
    { label: "Drafts", value: drafts, icon: Clock, color: "bg-amber-50 text-amber-600", link: "/saved-reviews?status=draft" },
    { label: "This Month", value: reviews.filter(r => {
      const d = new Date(r.created_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length, icon: TrendingUp, color: "bg-blue-50 text-blue-600", link: "/saved-reviews?status=reviewed&month=current" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Claims Dashboard
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1.5">Smarter Claims. Better Decisions.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            AI-powered claims intelligence platform for liability, coverage, venue, and exposure analysis.
          </p>
        </div>
        <Link to="/new-review">
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <FilePlus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      {showBetaElements && <BetaBanner />}

      {showBetaElements && (
        <div className="flex justify-center">
          <BetaUsageIndicator />
        </div>
      )}

      <DisclaimerBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const card = (
            <Card key={stat.label} className={`shadow-sm ${stat.link ? "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? "—" : stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return stat.link ? <Link key={stat.label} to={stat.link}>{card}</Link> : card;
        })}
      </div>

      {/* Claim Readiness */}
      {latestReviewed && (
        <ClaimReadinessCard
          score={latestReviewed.readiness_score}
          claimName={latestReviewed.claim_name}
          onViewDetails={() => setReadinessOpen(true)}
        />
      )}

      {/* Recent Reviews */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Recent Intelligence Reports</CardTitle>
          <Link to="/saved-reviews">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No analyses yet</p>
              <Link to="/new-review">
                <Button variant="outline" size="sm" className="mt-3">
                  Run Your First Analysis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((review) => (
                <Link
                  key={review.id}
                  to={`/review/${review.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="font-medium text-sm truncate">{review.claim_name}</p>
                      <StatusBadge status={review.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{review.claim_number}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{review.line_of_business}</span>
                      {review.created_date && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_date), "MMM d, yyyy")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClaimReadinessPanel
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        review={latestReviewed}
      />
    </div>
  );
}