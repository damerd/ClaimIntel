import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, FileText, Shield, Scale, DollarSign, Stethoscope,
  TrendingUp, AlertTriangle, HelpCircle, ListChecks,
  Copy, Archive, Loader2, CalendarDays, MapPin,
  Briefcase, Hash, UserCheck, BarChart2,
  Crosshair, Swords, MessageCircleQuestion, ClipboardCheck, Gavel, ArrowRight,
} from "lucide-react";
import ReviewSection from "@/components/claims/ReviewSection";
import StatusBadge from "@/components/claims/StatusBadge";
import ReviewBadges from "@/components/claims/ReviewBadges";
import FollowUpAssistant from "@/components/claims/FollowUpAssistant";
import ClaimOverviewTable from "@/components/claims/ClaimOverviewTable";
import ReportExportMenu from "@/components/claims/ReportExportMenu";
import ClaimIntelMark from "@/components/brand/ClaimIntelMark";
import FounderSignature from "@/components/brand/FounderSignature";
import { APPLICATION_IDENTITY } from "@/config/applicationIdentity";
import ClaimReadinessPanel from "@/components/claims/ClaimReadinessPanel";
import { useUserRole } from "@/hooks/useUserRole";
import { buildReportModel, buildReportText } from "@/lib/reportContent";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { archiveClaimReview, getClaimReview } from "@/services/claimArchiveService";

const SECTION_ICONS = {
  executive_summary: FileText,
  liability_assessment: Scale,
  coverage_summary: Shield,
  coverage_issues: Shield,
  venue_exposure_analysis: BarChart2,
  exposure_analysis: Crosshair,
  damages_summary: DollarSign,
  medical_timeline: Stethoscope,
  medical_treatment_summary: Stethoscope,
  strengths: Swords,
  weaknesses: AlertTriangle,
  missing_information: HelpCircle,
  recommended_next_steps: ListChecks,
  suggested_follow_up_questions: MessageCircleQuestion,
  overall_claim_assessment: ClipboardCheck,
  supervisor_review: UserCheck,
  strengths_and_weaknesses: Swords,
  settlement_evaluation: TrendingUp,
  red_flags: AlertTriangle,
  litigation_status: Gavel,
};

const SECTION_ACCENTS = {
  executive_summary: "bg-primary",
  liability_assessment: "bg-indigo-600",
  coverage_summary: "bg-blue-600",
  coverage_issues: "bg-amber-600",
  venue_exposure_analysis: "bg-sky-600",
  exposure_analysis: "bg-orange-600",
  damages_summary: "bg-emerald-600",
  medical_timeline: "bg-teal-600",
  medical_treatment_summary: "bg-teal-600",
  strengths: "bg-green-600",
  weaknesses: "bg-red-500",
  missing_information: "bg-rose-500",
  recommended_next_steps: "bg-lime-600",
  suggested_follow_up_questions: "bg-blue-500",
  overall_claim_assessment: "bg-slate-700",
  supervisor_review: "bg-violet-700",
  strengths_and_weaknesses: "bg-cyan-600",
  settlement_evaluation: "bg-green-600",
  red_flags: "bg-red-600",
  litigation_status: "bg-purple-600",
};

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
  const { showBetaElements } = useUserRole();
  const [readinessOpen, setReadinessOpen] = useState(false);

  const { data: review, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["claimReview", id],
    queryFn: () => getClaimReview(id),
    retry: 1,
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveClaimReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claimReview", id] });
      queryClient.invalidateQueries({ queryKey: ["claimReviews"] });
      toast.success("Report archived");
    },
    onError: (mutationError) => {
      toast.error(mutationError.userMessage || mutationError.message);
    },
  });

  const copyToClipboard = () => {
    if (!review) return;
    navigator.clipboard.writeText(buildReportText(review));
    toast.success("Copied to clipboard", { description: "Full report text has been copied." });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="font-medium">Report unavailable</p>
        <p className="text-sm text-muted-foreground">{error?.userMessage || error?.message}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          <Link to="/saved-reviews"><Button variant="ghost">View Saved Reports</Button></Link>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Report not found.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const reportModel = buildReportModel(review);
  const activeSections = reportModel.sections;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 relative">
      {/* Beta Watermark */}
      {showBetaElements && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <div className="rotate-3 border-2 border-primary/10 text-primary/10 font-heading font-bold text-xs px-3 py-1 rounded">
            Generated with ClaimIntel Beta
          </div>
        </div>
      )}

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

      {/* Professional Report Header */}
      <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <ClaimIntelMark size={32} variant="light" />
          <div>
            <p className="font-bold text-lg tracking-tight">{APPLICATION_IDENTITY.productName}</p>
            <p className="text-xs text-primary-foreground/70">Claims Intelligence Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-primary-foreground/70">Prepared by {APPLICATION_IDENTITY.reportPreparedBy}</p>
          <p className="text-[10px] text-primary-foreground/60">{APPLICATION_IDENTITY.signature}</p>
          <p className="text-[10px] text-primary-foreground/60">{APPLICATION_IDENTITY.founderTitle}</p>
          <p className="text-[10px] text-primary-foreground/60">Version {APPLICATION_IDENTITY.version}</p>
          <p className="text-xs text-primary-foreground/70">
            {review.created_date ? format(new Date(review.created_date), "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>
        {showBetaElements && (
          <div className="absolute top-2 right-3">
            <span className="text-[9px] uppercase tracking-wider bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">Beta</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
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
              <ReportExportMenu review={review} />
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

      {/* Claim Overview Table */}
      <ClaimOverviewTable review={review} />

      {/* Claim Readiness */}
      {review.readiness_score != null && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Claim Readiness</p>
                  <p className="text-2xl font-bold">{Math.round(review.readiness_score)}%</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReadinessOpen(true)}>
                View Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Sections */}
      <div className="space-y-4">
        {activeSections.map((s) => (
          <ReviewSection
            key={s.key}
            title={s.title}
            icon={SECTION_ICONS[s.key] || FileText}
            content={s.content}
            accentColor={SECTION_ACCENTS[s.key] || "bg-primary"}
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

      {/* Claim Readiness Panel */}
      <ClaimReadinessPanel
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        review={review}
      />

      {/* Disclaimer */}
      <div className="text-center py-6 border-t space-y-1">
        {showBetaElements && (
          <p className="text-[11px] font-medium text-muted-foreground">
            Generated with ClaimIntel Beta
          </p>
        )}
        <div className="flex justify-center py-1">
          <FounderSignature compact />
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground/80">
          Smarter Claims. Better Decisions.
        </p>
        <p className="text-[11px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
          This report was generated by ClaimIntel and is for educational and portfolio purposes only.
          Analysis is based solely on information contained within the uploaded claim file and supporting documents.
        </p>
      </div>
    </div>
  );
}