import { rawBase44 } from "@/api/rawBase44Client";
import {
  assertValidClaimReview,
  normalizeClaimNumber,
  pickWritableClaimFields,
} from "@/lib/claimValidation";
import { recordAuditEvent } from "@/services/auditRepository";
import {
  appendClaimHistory,
  listClaimHistory,
} from "@/services/claimHistoryRepository";
import {
  getLatestClaimAnalysis,
  mergeReviewWithAnalysis,
} from "@/services/claimAnalysisRepository";
import { listClaimDocuments } from "@/services/claimDocumentRepository";

function activeRecordClause() {
  return {
    $or: [
      { record_status: "active" },
      { record_status: { $exists: false } },
    ],
  };
}

async function findDuplicateClaimNumber(normalizedClaimNumber, excludeId = null) {
  if (!normalizedClaimNumber) return null;

  const matches = await rawBase44.entities.ClaimReview.filter(
    {
      normalized_claim_number: normalizedClaimNumber,
      ...activeRecordClause(),
    },
    "-created_date",
    10
  );

  return matches.find((claim) => claim.id !== excludeId) || null;
}

export async function createClaimReview(input) {
  const writable = pickWritableClaimFields(input);
  const payload = {
    ...writable,
    normalized_claim_number: normalizeClaimNumber(writable.claim_number),
    status: writable.status || "draft",
    record_status: "active",
    version: 1,
    last_activity_at: new Date().toISOString(),
  };

  assertValidClaimReview(payload);

  const duplicate = await findDuplicateClaimNumber(payload.normalized_claim_number);
  if (duplicate) {
    const error = new Error(`Claim number ${payload.claim_number} already exists`);
    error.name = "DuplicateClaimNumberError";
    error.existingClaimId = duplicate.id;
    throw error;
  }

  try {
    const created = await rawBase44.entities.ClaimReview.create(payload);

    await appendClaimHistory({
      claimReviewId: created.id,
      version: 1,
      eventType: "created",
      before: {},
      after: created,
      changeSummary: "Created claim review record",
    });

    await recordAuditEvent("claim_review_created", {
      relatedClaimId: created.id,
      metadata: {
        claim_number: created.claim_number,
        line_of_business: created.line_of_business,
        jurisdiction: created.jurisdiction,
      },
    });

    return created;
  } catch (error) {
    await recordAuditEvent("claim_review_create_failed", {
      success: false,
      errorCode: error?.name || "CREATE_ERROR",
      metadata: {
        claim_number: payload.claim_number,
        line_of_business: payload.line_of_business,
      },
    });
    throw error;
  }
}

export async function getClaimReview(id, { includeDeleted = false } = {}) {
  const records = await rawBase44.entities.ClaimReview.filter({ id }, "-created_date", 1);
  const review = records[0] || null;
  if (!includeDeleted && review?.record_status === "deleted") return null;
  return review;
}

export async function listClaimReviews({
  search = "",
  status = "all",
  jurisdiction = "all",
  lineOfBusiness = "all",
  includeDeleted = false,
  sort = "-created_date",
  limit = 100,
  skip = 0,
} = {}) {
  const clauses = [];

  if (!includeDeleted) clauses.push(activeRecordClause());
  if (status !== "all") clauses.push({ status });
  if (jurisdiction !== "all") clauses.push({ jurisdiction });
  if (lineOfBusiness !== "all") clauses.push({ line_of_business: lineOfBusiness });

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    clauses.push({
      $or: [
        { claim_name: { $regex: safeSearch, $options: "i" } },
        { claim_number: { $regex: safeSearch, $options: "i" } },
        { claimant_name: { $regex: safeSearch, $options: "i" } },
        { insured_name: { $regex: safeSearch, $options: "i" } },
      ],
    });
  }

  const query = clauses.length === 0
    ? {}
    : clauses.length === 1
      ? clauses[0]
      : { $and: clauses };

  return rawBase44.entities.ClaimReview.filter(query, sort, limit, skip);
}

export async function updateClaimReview(id, updates, changeSummary = "Updated claim review") {
  const current = await getClaimReview(id, { includeDeleted: true });
  if (!current) throw new Error("Claim review not found");

  const writable = pickWritableClaimFields(updates);
  assertValidClaimReview(writable, { partial: true });

  if (writable.claim_number != null) {
    writable.normalized_claim_number = normalizeClaimNumber(writable.claim_number);
    const duplicate = await findDuplicateClaimNumber(
      writable.normalized_claim_number,
      current.id
    );
    if (duplicate) {
      const error = new Error(`Claim number ${writable.claim_number} already exists`);
      error.name = "DuplicateClaimNumberError";
      error.existingClaimId = duplicate.id;
      throw error;
    }
  }

  const nextVersion = (current.version || 1) + 1;
  const updated = await rawBase44.entities.ClaimReview.update(id, {
    ...writable,
    version: nextVersion,
    last_activity_at: new Date().toISOString(),
  });

  await appendClaimHistory({
    claimReviewId: id,
    version: nextVersion,
    eventType: current.status !== updated.status ? "status_changed" : "updated",
    before: current,
    after: updated,
    changeSummary,
  });

  await recordAuditEvent("claim_review_updated", {
    relatedClaimId: id,
    metadata: {
      version: nextVersion,
      status: updated.status,
    },
  });

  return updated;
}

export function archiveClaimReview(id) {
  return updateClaimReview(id, { status: "archived" }, "Archived claim review");
}

export async function softDeleteClaimReview(id, reason = "Deleted by user") {
  const current = await getClaimReview(id, { includeDeleted: true });
  if (!current) throw new Error("Claim review not found");
  if (current.record_status === "deleted") return current;

  const nextVersion = (current.version || 1) + 1;
  const updated = await rawBase44.entities.ClaimReview.update(id, {
    record_status: "deleted",
    deleted_at: new Date().toISOString(),
    deletion_reason: String(reason).slice(0, 500),
    version: nextVersion,
    last_activity_at: new Date().toISOString(),
  });

  await appendClaimHistory({
    claimReviewId: id,
    version: nextVersion,
    eventType: "soft_deleted",
    before: current,
    after: updated,
    changeSummary: "Soft-deleted claim review",
  });

  await recordAuditEvent("claim_review_soft_deleted", {
    relatedClaimId: id,
    metadata: { version: nextVersion },
  });

  return updated;
}

export async function restoreClaimReview(id) {
  const current = await getClaimReview(id, { includeDeleted: true });
  if (!current) throw new Error("Claim review not found");
  if (current.record_status !== "deleted") return current;

  const nextVersion = (current.version || 1) + 1;
  const updated = await rawBase44.entities.ClaimReview.update(id, {
    record_status: "active",
    deleted_at: "",
    deletion_reason: "",
    version: nextVersion,
    last_activity_at: new Date().toISOString(),
  });

  await appendClaimHistory({
    claimReviewId: id,
    version: nextVersion,
    eventType: "restored",
    before: current,
    after: updated,
    changeSummary: "Restored soft-deleted claim review",
  });

  await recordAuditEvent("claim_review_restored", {
    relatedClaimId: id,
    metadata: { version: nextVersion },
  });

  return updated;
}

export async function getClaimPackage(id, { includeDeleted = false } = {}) {
  const review = await getClaimReview(id, { includeDeleted });
  if (!review) return null;

  const [analysis, documents, history] = await Promise.all([
    getLatestClaimAnalysis(id),
    listClaimDocuments(id),
    listClaimHistory(id),
  ]);

  return {
    review: mergeReviewWithAnalysis(review, analysis),
    analysis,
    documents,
    history,
  };
}
