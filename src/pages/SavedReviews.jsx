import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  Filter,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import BetaBanner from "@/components/claims/BetaBanner";
import StatusBadge from "@/components/claims/StatusBadge";
import {
  listClaimReviews,
  softDeleteClaimReview,
} from "@/services/claimReviewRepository";

const LINES_OF_BUSINESS = [
  "Commercial Auto",
  "Personal Auto",
  "General Liability",
  "Workers Compensation",
  "Property",
  "Professional Liability",
  "Product Liability",
  "Other",
];

export default function SavedReviews() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [lineOfBusinessFilter, setLineOfBusinessFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    if (status) setStatusFilter(status);
    if (month === "current") {
      const now = new Date();
      setMonthFilter(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      );
    }
  }, [searchParams]);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [
      "claimReviews",
      deferredSearch,
      statusFilter,
      lineOfBusinessFilter,
    ],
    queryFn: () =>
      listClaimReviews({
        search: deferredSearch,
        status: statusFilter,
        lineOfBusiness: lineOfBusinessFilter,
        includeDeleted: false,
        limit: 100,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => softDeleteClaimReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claimReviews"] });
      toast.success("Report removed", {
        description: "The report was soft-deleted and its history was preserved.",
      });
    },
    onError: (error) => {
      toast.error("Report could not be removed", {
        description: error?.message || "Please try again.",
      });
    },
  });

  const filtered = reviews.filter((review) => {
    if (monthFilter === "all") return true;
    if (!review.created_date) return false;
    const date = new Date(review.created_date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return yearMonth === monthFilter;
  });

  const monthOptions = Array.from(
    new Set(
      reviews
        .filter((review) => review.status === "reviewed" && review.created_date)
        .map((review) => {
          const date = new Date(review.created_date);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        })
    )
  ).sort().reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
          Claims Intelligence Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse, search, and manage ClaimIntel analyses and claim intelligence reports.
        </p>
      </div>

      <BetaBanner />

      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search claims, claim numbers, insureds, or claimants..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setMonthFilter("all");
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={lineOfBusinessFilter}
              onValueChange={setLineOfBusinessFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Lines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {LINES_OF_BUSINESS.map((line) => (
                  <SelectItem key={line} value={line}>
                    {line}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {statusFilter === "reviewed" && monthOptions.length > 0 && (
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map((yearMonth) => {
                    const [year, month] = yearMonth.split("-");
                    const label = new Date(
                      Number(year),
                      Number(month) - 1
                    ).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <SelectItem key={yearMonth} value={yearMonth}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No reports found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.length === 0
              ? "Run your first ClaimIntel analysis to get started."
              : "Try adjusting your filters."}
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
            <Card
              key={review.id}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <Link
                  to={`/review/${review.id}`}
                  className="flex-1 min-w-0 group"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {review.claim_name}
                    </p>
                    <StatusBadge status={review.status} />
                    {review.venue_risk_level && review.venue_risk_level !== "Unknown" && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                          review.venue_risk_level === "Severe"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : review.venue_risk_level === "High"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : review.venue_risk_level === "Moderate"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        Venue: {review.venue_risk_level}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {review.claim_number}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {review.jurisdiction}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {review.line_of_business}
                    </span>
                    {review.created_date && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_date), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                    {review.version && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          Version {review.version}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Review</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will hide “{review.claim_name}” from active reports while
                          preserving its database history for recovery and auditing.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(review.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Remove Review
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
