import { rawBase44 } from "@/api/rawBase44Client";
import {
  buildAnalysisResult,
  buildConsolidatedDocument,
  buildSummaryUpdate,
  containsGeneratedAnalysis,
} from "@/lib/analysisPersistence";
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
import { saveClaimDocuments } from "@/services/claimDocumentRepository";
import { recordAuditEvent } from "@/services/auditRepository";

function owns(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

async function hydrateReview(review) {
  if (!review || review.record_status === "deleted") return null;
  const analysis = await getLatestClaimAnalysis(review.id);
  return mergeReviewWithAnalysis(review, analysis);
}

async function persistConsolidatedClaimDocument(review, payload) {
  const document = buildConsolidatedDocument(payload, review);
  if (!document) return [];

  try {
    return await saveClaimDocuments(review.id, [document]);
  } catch (error) {
    await recordAuditEvent("claim_document_save_failed", {
      success: false,
      relatedClaimId: review.id,
      errorCode: error?.name || "DOCUMENT_SAVE_ERROR",
      metadata: { document_type: document.documentType },
    });
    return [];
  }
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
    const review = await createClaimReview(payload);
    await persistConsolidatedClaimDocument(review, payload);
    return review;
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
