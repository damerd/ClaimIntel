import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, FileText, Shield, Scale, DollarSign, Stethoscope,
  Gavel, TrendingUp, AlertTriangle, HelpCircle, ListChecks,
  Copy, Download, Archive, Loader2, CalendarDays, MapPin,
  Briefcase, Hash, ClipboardList, UserCheck, BarChart2,
} from "lucide-react";
import ReviewSection from "@/components/claims/ReviewSection";
import StatusBadge from "@/components/claims/StatusBadge";
import ConfidenceBadge from "@/components/claims/ConfidenceBadge";
import ReviewBadges from "@/components/claims/ReviewBadges";
import FollowUpAssistant from "@/components/claims/FollowUpAssistant";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

const ALL_SECTION_DEFS = [
  { key: "executive_summary", title: "Executive Summary", icon: FileText, accent: "bg-primary" },
  { key: "coverage_summary", title: "Coverage Summary", icon: Shield, accent: "bg-blue-600" },
  { key: "coverage_issues", title: "Coverage Issues", icon: Shield, accent: "bg-amber-600" },
  { key: "liability_assessment", title: "Liability Assessment", icon: Scale, accent: "bg-indigo-600" },
  { key: "damages_summary", title: "Damages Summary", icon: DollarSign, accent: "bg-emerald-600" },
  { key: "medical_treatment_summary", title: "Medical Treatment Summary", icon: Stethoscope, accent: "bg-teal-600" },
  { key: "litigation_status", title: "Litigation Status", icon: Gavel, accent: "bg-purple-600" },
  { key: "venue_exposure_analysis", title: "Venue Exposure Analysis", icon: BarChart2, accent: "bg-sky-600" },
  { key: "settlement_evaluation", title: "Settlement Evaluation", icon: TrendingUp, accent: "bg-green-600" },
  { key: "red_flags", title: "Red Flags", icon: AlertTriangle, accent: "bg-red-600" },
  { key: "missing_information", title: "Missing Information", icon: HelpCircle, accent: "bg-rose-500" },
  { key: "recommended_next_steps", title: "Recommended Next Steps", icon: ListChecks, accent: "bg-lime-600" },
  { key: "supervisor_review", title: "Supervisor Review", icon: UserCheck, accent: "bg-violet-700" },
];

const VENUE_RISK_COLORS = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Severe: "bg-red-50 text-red-700 border-red-200",
  Unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ClaimReviewResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: review, isLoading } = useQuery({
    queryKey: ["claimReview", id],
    queryFn: async () => {
      const reviews = await base44.entities.ClaimReview.filter({ id });
      return reviews[0];
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => base44.entities.ClaimReview.update(id, { status: "archived" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claimReview", id] });
      toast.success("Review archived");
    },
  });

  const getActiveSections = () => {
    if (!review) return [];
    const selected = review.selected_sections;
    if (selected && selected.length > 0) {
      return ALL_SECTION_DEFS.filter((s) => selected.includes(s.key) && review[s.key]);
    }
    // Fallback for old reviews without selected_sections
    return ALL_SECTION_DEFS.filter((s) => review[s.key]);
  };

  const copyToClipboard = () => {
    if (!review) return;
    const sections = getActiveSections();
    const text = sections
      .map((s) => `## ${s.title}\n${review[s.key]}`)
      .join("\n\n");

    const header = `CLAIMINTEL — CLAIMS INTELLIGENCE REPORT\nClaim: ${review.claim_name}\nClaim #: ${review.claim_number}\nDate of Loss: ${review.date_of_loss}\nJurisdiction: ${review.jurisdiction}\nLine of Business: ${review.line_of_business}\nConfidence Level: ${review.confidence_level || "N/A"}\nVenue Risk: ${review.venue_risk_level || "N/A"}\nLiability: ${review.liability_allocation_summary || "N/A"}\nIntelligence Report Generated: ${review.created_date ? format(new Date(review.created_date), "MMMM d, yyyy") : "N/A"}\n${"=".repeat(60)}\n\n`;

    navigator.clipboard.writeText(header + text);
    toast.success("Copied to clipboard", { description: "Full review text has been copied." });
  };

  const exportReport = () => {
    if (!review) return;
    const sections = getActiveSections();
    const text = sections
      .map((s) => `${"=".repeat(60)}\n${s.title.toUpperCase()}\n${"=".repeat(60)}\n\n${review[s.key]}\n`)
      .join("\n");

    const header = `${"=".repeat(60)}\nCLAIMINTEL — CLAIMS INTELLIGENCE REPORT\n${"=".repeat(60)}\n\nClaim Name: ${review.claim_name}\nClaim Number: ${review.claim_number}\nDate of Loss: ${review.date_of_loss}\nJurisdiction: ${review.jurisdiction}\nLine of Business: ${review.line_of_business}\nConfidence Level: ${review.confidence_level || "N/A"}\nVenue Risk Level: ${review.venue_risk_level || "N/A"}\nLiability Allocation: ${review.liability_allocation_summary || "N/A"}\nIntelligence Report Generated: ${review.created_date ? format(new Date(review.created_date), "MMMM d, yyyy 'at' h:mm a") : "N/A"}\n\nDISCLAIMER: This report was generated by ClaimIntel for educational and portfolio purposes only. Analysis is based solely on information contained within the uploaded claim file and supporting documents. It is not legal advice and should not be used for actual claims handling decisions.\n\n`;

    const blob = new Blob([header + text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ClaimIntel_Report_${review.claim_number || "report"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", { description: "Text file downloaded." });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Review not found.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const activeSections = getActiveSections();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-1 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">{review.claim_name}</h1>
              <StatusBadge status={review.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="w-3 h-3" />{review.claim_number}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3 h-3" />{review.date_of_loss}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{review.jurisdiction}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3" />{review.line_of_business}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <ConfidenceBadge level={review.confidence_level} />
              {review.venue_risk_level && (
                <Badge variant="outline" className={`text-xs font-medium ${VENUE_RISK_COLORS[review.venue_risk_level] || VENUE_RISK_COLORS.Unknown}`}>
                  Venue: {review.venue_risk_level}
                </Badge>
              )}
              {review.liability_allocation_summary && (
                <Badge variant="outline" className="text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Scale className="w-3 h-3 mr-1" />
                  {review.liability_allocation_summary}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-3.5 h-3.5 mr-1.5" />Copy
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="w-3.5 h-3.5 mr-1.5" />Export
              </Button>
              {review.status !== "archived" && (
                <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
                  <Archive className="w-3.5 h-3.5 mr-1.5" />Archive
                </Button>
              )}
            </div>
          </div>
          <ReviewBadges review={review} />
        </CardContent>
      </Card>

      {/* Review Sections — only show selected/populated sections */}
      <div className="space-y-4">
        {activeSections.map((s) => (
          <ReviewSection
            key={s.key}
            title={s.title}
            icon={s.icon}
            content={review[s.key]}
            accentColor={s.accent}
          />
        ))}
      </div>

      {/* Reviewer Notes */}
      {review.reviewer_notes && (
        <Card className="shadow-sm border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Reviewer Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">{review.reviewer_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Follow-Up Assistant — always present on completed reports */}
      {(review.status === "reviewed" || review.status === "archived") && (
        <FollowUpAssistant review={review} />
      )}

      {/* Disclaimer */}
      <div className="text-center py-6 border-t">
        <p className="text-[11px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
          This report was generated by ClaimIntel and is for educational and portfolio purposes only.
          Analysis is based solely on information contained within the uploaded claim file and supporting documents.
        </p>
      </div>
    </div>
  );
}