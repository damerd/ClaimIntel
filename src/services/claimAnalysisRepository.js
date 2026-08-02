import { base44 } from "@/api/base44Client";
import { recordAuditEvent } from "@/services/auditRepository";
import { appendClaimHistory } from "@/services/claimHistoryRepository";

const ANALYSIS_SUMMARY_FIELDS = [
  "confidence_level",
  "venue_risk_level",
  "liability_allocation_summary",
  "readiness_score",
];

function buildAnalysisRecord(claimReviewId, result, selectedSections, version) {
  const summary = ANALYSIS_SUMMARY_FIELDS.reduce((values, field) => {
    if (result?.[field] != null) values[field] = result[field];
    return values;
  }, {});

  return {
    claim_review_id: claimReviewId,
    version,
    analysis_status: "completed",
    selected_sections: selectedSections || [],
    analysis_payload: JSON.stringify(result || {}),
    ...summary,
    model_name: "Base44 Core InvokeLLM",
    generated_at: new Date().toISOString(),
  };
}

export async function getLatestClaimAnalysis(claimReviewId) {
  const records = await base44.entities.ClaimAnalysis.filter(
    { claim_review_id: claimReviewId },
    "-version",
    1
  );
  return records[0] || null;
}

export async function saveClaimAnalysis({
  claimReview,
  result,
  selectedSections = [],
}) {
  const latest = await getLatestClaimAnalysis(claimReview.id);
  const nextVersion = (latest?.version || 0) + 1;
  const analysis = await base44.entities.ClaimAnalysis.create(
    buildAnalysisRecord(claimReview.id, result, selectedSections, nextVersion)
  );

  await appendClaimHistory({
    claimReviewId: claimReview.id,
    version: (claimReview.version || 1) + 1,
    eventType: "analysis_saved",
    before: claimReview,
    after: {
      ...claimReview,
      status: "reviewed",
      version: (claimReview.version || 1) + 1,
    },
    changeSummary: `Saved analysis version ${nextVersion}`,
  });

  await recordAuditEvent("claim_analysis_saved", {
    relatedClaimId: claimReview.id,
    metadata: {
      analysis_version: nextVersion,
      section_count: selectedSections.length,
      readiness_score: result?.readiness_score ?? null,
    },
  });

  return analysis;
}

export async function saveFailedClaimAnalysis({
  claimReviewId,
  selectedSections = [],
  error,
}) {
  const latest = await getLatestClaimAnalysis(claimReviewId);
  const nextVersion = (latest?.version || 0) + 1;
  const failureMessage = String(error?.message || "Analysis failed").slice(0, 1000);

  const analysis = await base44.entities.ClaimAnalysis.create({
    claim_review_id: claimReviewId,
    version: nextVersion,
    analysis_status: "failed",
    selected_sections: selectedSections,
    failure_message: failureMessage,
    generated_at: new Date().toISOString(),
  });

  await recordAuditEvent("claim_analysis_failed", {
    success: false,
    relatedClaimId: claimReviewId,
    errorCode: error?.name || "ANALYSIS_ERROR",
    metadata: { analysis_version: nextVersion },
  });

  return analysis;
}

export function parseAnalysisPayload(analysis) {
  if (!analysis?.analysis_payload) return {};
  try {
    return JSON.parse(analysis.analysis_payload);
  } catch {
    return {};
  }
}

export function mergeReviewWithAnalysis(review, analysis) {
  if (!analysis) return review;
  return {
    ...review,
    ...parseAnalysisPayload(analysis),
    analysis_record_id: analysis.id,
    analysis_version: analysis.version,
    analysis_status: analysis.analysis_status,
  };
}
