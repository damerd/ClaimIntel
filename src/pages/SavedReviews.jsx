import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FolderOpen,
  Search,
  ArrowRight,
  Trash2,
  Filter,
  Loader2,
} from "lucide-react";
import StatusBadge from "@/components/claims/StatusBadge";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function SavedReviews() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    if (status) setStatusFilter(status);
    if (month === "current") {
      const now = new Date();
      setMonthFilter(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
  }, []);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["claimReviews"],
    queryFn: () => base44.entities.ClaimReview.list("-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClaimReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claimReviews"] });
      toast.success("Report deleted");
    },
  });

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      !search ||
      r.claim_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.claim_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesMonth = monthFilter === "all" || (() => {
      if (!r.created_date) return false;
      const d = new Date(r.created_date);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return ym === monthFilter;
    })();
    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Build a list of unique year-month options from reviewed reviews
  const monthOptions = Array.from(
    new Set(
      reviews
        .filter((r) => r.status === "reviewed" && r.created_date)
        .map((r) => {
          const d = new Date(r.created_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        })
    )
  ).sort().reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Claims Intelligence Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse, search, and manage ClaimIntel analyses and claim intelligence reports.</p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by claim name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setMonthFilter("all"); }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter === "reviewed" && monthOptions.length > 0 && (
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map((ym) => {
                    const [year, month] = ym.split("-");
                    const label = new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });
                    return <SelectItem key={ym} value={ym}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No reports found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.length === 0 ? "Run your first ClaimIntel analysis to get started." : "Try adjusting your filters."}
          </p>
          {reviews.length === 0 && (
            <Link to="/new-review">
              <Button className="mt-4">Run Analysis</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <Card key={review.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <Link to={`/review/${review.id}`} className="flex-1 min-w-0 group">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {review.claim_name}
                    </p>
                    <StatusBadge status={review.status} />
                    {review.venue_risk_level && review.venue_risk_level !== "Unknown" && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                        review.venue_risk_level === "Severe" ? "bg-red-50 text-red-700 border-red-200" :
                        review.venue_risk_level === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        review.venue_risk_level === "Moderate" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        Venue: {review.venue_risk_level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{review.claim_number}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{review.jurisdiction}</span>
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
                  {review.liability_allocation_summary && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Liability: {review.liability_allocation_summary}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/review/${review.id}`}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{review.claim_name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(review.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}