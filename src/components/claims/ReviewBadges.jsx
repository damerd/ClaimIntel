import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HelpCircle, Shield, Eye } from "lucide-react";

export default function ReviewBadges({ review }) {
  const badges = [];

  const redFlagsText = (review.red_flags || "").toLowerCase();
  const venueRisk = review.venue_risk_level;
  const coverageIssues = (review.coverage_issues || "").toLowerCase();
  const missingInfo = (review.missing_information || "").toLowerCase();
  const supervisorReview = (review.supervisor_review || "").toLowerCase();

  const hasHighRisk =
    venueRisk === "High" || venueRisk === "Severe" ||
    redFlagsText.includes("high") || redFlagsText.includes("fraud") ||
    redFlagsText.includes("severe");

  const hasCoverageIssue =
    coverageIssues && !coverageIssues.includes("no coverage issues") &&
    !coverageIssues.includes("none apparent") &&
    coverageIssues.length > 10;

  const hasMissingInfo =
    missingInfo && !missingInfo.includes("no missing") &&
    missingInfo.length > 10;

  const needsSupervisor =
    supervisorReview.includes("roundtable") ||
    supervisorReview.includes("defense counsel") ||
    supervisorReview.includes("increase reserves") ||
    supervisorReview.includes("mediation") ||
    hasHighRisk;

  if (hasHighRisk)
    badges.push(
      <Badge key="high-risk" className="bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" /> High Risk
      </Badge>
    );

  if (hasCoverageIssue)
    badges.push(
      <Badge key="coverage" className="bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
        <Shield className="w-3 h-3" /> Coverage Issue
      </Badge>
    );

  if (hasMissingInfo)
    badges.push(
      <Badge key="missing" className="bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
        <HelpCircle className="w-3 h-3" /> Missing Information
      </Badge>
    );

  if (needsSupervisor)
    badges.push(
      <Badge key="supervisor" className="bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
        <Eye className="w-3 h-3" /> Supervisor Attention Needed
      </Badge>
    );

  if (badges.length === 0) return null;

  return <div className="flex flex-wrap gap-2">{badges}</div>;
}