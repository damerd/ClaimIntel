import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock3,
  Database,
  FileText,
  History,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClaimPackage,
  restoreClaimReview,
} from "@/services/claimReviewRepository";

function formatEventType(value = "updated") {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ClaimHistory() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    data: claimPackage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["claimHistory", id],
    queryFn: () => getClaimPackage(id, { includeDeleted: true }),
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreClaimReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claimHistory", id] });
      queryClient.invalidateQueries({ queryKey: ["claimReviews"] });
      toast.success("Claim review restored");
    },
    onError: (restoreError) => {
      toast.error("Claim review could not be restored", {
        description: restoreError?.message || "Please try again.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !claimPackage?.review) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-muted-foreground">
          {error?.message || "Claim history could not be found."}
        </p>
        <Link to="/saved-reviews">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  const { review, analysis, documents = [], history = [] } = claimPackage;
  const deleted = review.record_status === "deleted";

  const summaryCards = [
    {
      label: "Core Record Version",
      value: review.version || 1,
      icon: Database,
    },
    {
      label: "Analysis Version",
      value: analysis?.version || "Legacy",
      icon: ShieldCheck,
    },
    {
      label: "Related Documents",
      value: documents.length,
      icon: FileText,
    },
    {
      label: "History Events",
      value: history.length,
      icon: History,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/saved-reviews">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                Database History
              </h1>
              <Badge variant={deleted ? "destructive" : "outline"}>
                {deleted ? "Deleted" : "Active"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {review.claim_name} · {review.claim_number}
            </p>
          </div>
        </div>

        {deleted && (
          <Button
            variant="outline"
            onClick={() => restoreMutation.mutate()}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Restore Record
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Current Database State</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <StateField label="Status" value={review.status || "Unknown"} />
          <StateField label="Record Status" value={review.record_status || "Active (legacy)"} />
          <StateField label="Jurisdiction" value={review.jurisdiction || "Unknown"} />
          <StateField label="Line of Business" value={review.line_of_business || "Unknown"} />
          <StateField
            label="Last Activity"
            value={
              review.last_activity_at
                ? format(new Date(review.last_activity_at), "MMM d, yyyy h:mm a")
                : "Not recorded"
            }
          />
          <StateField
            label="Deleted At"
            value={
              review.deleted_at
                ? format(new Date(review.deleted_at), "MMM d, yyyy h:mm a")
                : "Not deleted"
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Version and Activity Timeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                This legacy record does not have version-history entries yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((event, index) => {
                const changedFields = Array.isArray(event.changed_fields)
                  ? event.changed_fields
                  : [];

                return (
                  <div key={event.id || `${event.version}-${index}`} className="relative pl-7">
                    {index < history.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-[-20px] w-px bg-border" />
                    )}
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background bg-primary" />
                    <div className="border rounded-xl p-4 bg-card">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {formatEventType(event.event_type)}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              Version {event.version || "—"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.change_summary || "Database record updated."}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                          <p>
                            {event.occurred_at
                              ? format(new Date(event.occurred_at), "MMM d, yyyy h:mm a")
                              : "Time not recorded"}
                          </p>
                          <p>{event.actor_email || "Unknown actor"}</p>
                        </div>
                      </div>

                      {changedFields.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {changedFields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-[10px]">
                              {field.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StateField({ label, value }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>
      <p className="font-medium mt-1 break-words">{value}</p>
    </div>
  );
}
