import { rawBase44 } from "@/api/rawBase44Client";
import {
  createClaimReview,
  getClaimReview,
  softDeleteClaimReview,
  updateClaimReview,
} from "@/services/claimReviewRepository";
import {
  getLatestClaimAnalysis,
  mergeReviewWithAnalysis,
  saveClaimAnalysis,
} from "@/services/claimAnalysisRepository";

const REPORT_FIELDS = Object.freeze([
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

function parseStructuredValue(value) {
  if (typeof value !== "string") return value;
  if (!value.trim()) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function containsGeneratedAnalysis(payload = {}) {
  return REPORT_FIELDS.some((field) => owns(payload, field));
}

function buildAnalysisResult(payload = {}) {
  return REPORT_FIELDS.reduce((result, field) => {
    if (!owns(payload, field)) return result;
    result[field] = JSON_REPORT_FIELDS.has(field)
      ? parseStructuredValue(payload[field])
      : payload[field];
    return result;
  }, {});
}

function buildSummaryUpdate(payload = {}) {
  const update = {
    status: payload.status || "reviewed",
  };

  for (const field of SUMMARY_FIELDS) {
    if (owns(payload, field)) update[field] = payload[field];
  }

  return update;
}

async function hydrateReview(review) {
  if (!review || review.record_status === "deleted") return null;
  const analysis = await getLatestClaimAnalysis(review.id);
  return mergeReviewWithAnalysis(review, analysis);
}

/**
 * Backward-compatible ClaimReview entity adapter.
 *
 * Existing pages can continue calling base44.entities.ClaimReview while the
 * adapter routes core metadata to ClaimReview and generated report content to
 * the versioned ClaimAnalysis entity. Reads by ID are hydrated with the latest
 * analysis so legacy UI components do not need an immediate rewrite.
 */
export const claimReviewEntityAdapter = {
  async create(payload) {
    return createClaimReview(payload);
  },

  async update(id, payload = {}) {
    if (!containsGeneratedAnalysis(payload)) {
      return updateClaimReview(id, payload);
    }

    const current = await getClaimReview(id, { includeDeleted: true });
    if (!current) throw new Error("Claim review not found");

    const analysis = await saveClaimAnalysis({
      claimReview: current,
      result: buildAnalysisResult(payload),
      selectedSections: current.selected_sections || payload.selected_sections || [],
    });

    const updated = await updateClaimReview(
      id,
      buildSummaryUpdate(payload),
      `Saved analysis version ${analysis.version}`
    );

    return mergeReviewWithAnalysis(updated, analysis);
  },

  async get(id) {
    const review = await getClaimReview(id);
    return hydrateReview(review);
  },

  async filter(query = {}, ...args) {
    const records = await rawBase44.entities.ClaimReview.filter(query, ...args);
    const activeRecords = records.filter((record) => record.record_status !== "deleted");

    if (owns(query, "id")) {
      const hydrated = await Promise.all(activeRecords.map(hydrateReview));
      return hydrated.filter(Boolean);
    }

    return activeRecords;
  },

  async list(...args) {
    const records = await rawBase44.entities.ClaimReview.list(...args);
    return records.filter((record) => record.record_status !== "deleted");
  },

  async delete(id) {
    return softDeleteClaimReview(id);
  },

  bulkCreate(...args) {
    return rawBase44.entities.ClaimReview.bulkCreate(...args);
  },
};
