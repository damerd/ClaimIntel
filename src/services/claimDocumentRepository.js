import { rawBase44 } from "@/api/rawBase44Client";
import { recordAuditEvent } from "@/services/auditRepository";

function toDocumentRecord(claimReviewId, document) {
  return {
    claim_review_id: claimReviewId,
    file_name: document.name || document.file_name || "Unnamed document",
    document_type: document.documentType || document.document_type || "Unknown",
    mime_type: document.mimeType || document.mime_type || "application/octet-stream",
    file_size_bytes: Number(document.size || document.file_size_bytes || 0),
    storage_uri: document.file_url || document.storage_uri || "",
    content_hash: document.contentHash || document.content_hash || "",
    extracted_text: document.text || document.extracted_text || "",
    processing_status: document.status || document.processing_status || "processed",
    failure_message: document.error || document.failure_message || "",
    uploaded_at: document.uploaded_at || new Date().toISOString(),
  };
}

export async function saveClaimDocuments(claimReviewId, documents = []) {
  const records = documents
    .filter((document) => document && (document.name || document.file_name))
    .map((document) => toDocumentRecord(claimReviewId, document));

  if (records.length === 0) return [];

  const created = await rawBase44.entities.ClaimDocument.bulkCreate(records);
  await recordAuditEvent("claim_documents_saved", {
    relatedClaimId: claimReviewId,
    metadata: {
      document_count: created.length,
      document_types: created.map((document) => document.document_type || "Unknown"),
    },
  });

  return created;
}

export function listClaimDocuments(claimReviewId, limit = 100) {
  return rawBase44.entities.ClaimDocument.filter(
    { claim_review_id: claimReviewId },
    "created_date",
    limit
  );
}
