export const REPORT_FIELDS = Object.freeze([
  "executive_summary",
  "coverage_summary",
  "coverage_issues",
  "liability_assessment",
  "damages_summary",
  "medical_treatment_summary",
  "medical_timeline",
  "litigation_status",
  "venue_exposure_analysis",
  "exposure_analysis",
  "settlement_evaluation",
  "strengths",
  "weaknesses",
  "strengths_and_weaknesses",
  "red_flags",
  "missing_information",
  "recommended_next_steps",
  "suggested_follow_up_questions",
  "overall_claim_assessment",
  "supervisor_review",
  "venue_risk_level",
  "liability_allocation_summary",
  "confidence_level",
  "readiness_score",
  "readiness_categories",
  "missing_requirements",
  "readiness_recommendation",
  "comparative_verdict_data",
  "claim_knowledge",
  "validation_engine_data",
]);

const JSON_REPORT_FIELDS = new Set([
  "readiness_categories",
  "missing_requirements",
  "comparative_verdict_data",
  "claim_knowledge",
  "validation_engine_data",
]);

const SUMMARY_FIELDS = Object.freeze([
  "confidence_level",
  "venue_risk_level",
  "liability_allocation_summary",
  "readiness_score",
  "readiness_recommendation",
]);

function owns(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

export function parseStructuredValue(value) {
  if (typeof value !== "string") return value;
  if (!value.trim()) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function containsGeneratedAnalysis(payload = {}) {
  return REPORT_FIELDS.some((field) => owns(payload, field));
}

export function buildAnalysisResult(payload = {}) {
  return REPORT_FIELDS.reduce((result, field) => {
    if (!owns(payload, field)) return result;
    result[field] = JSON_REPORT_FIELDS.has(field)
      ? parseStructuredValue(payload[field])
      : payload[field];
    return result;
  }, {});
}

export function buildSummaryUpdate(payload = {}) {
  const update = {
    status: payload.status || "reviewed",
  };

  for (const field of SUMMARY_FIELDS) {
    if (owns(payload, field)) update[field] = payload[field];
  }

  return update;
}

export function buildConsolidatedDocument(payload = {}, review = {}) {
  const text = String(payload.claim_file_text || "").trim();
  if (!text) return null;

  const claimNumber = String(review.claim_number || payload.claim_number || "claim")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-");

  return {
    name: `${claimNumber || "claim"}-consolidated-file.txt`,
    documentType: "Consolidated Claim File Text",
    mimeType: "text/plain",
    size: text.length,
    text,
    status: "processed",
  };
}
