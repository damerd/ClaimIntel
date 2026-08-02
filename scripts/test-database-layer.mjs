import assert from "node:assert/strict";
import {
  getChangedFields,
  normalizeClaimNumber,
  pickWritableClaimFields,
  sanitizeAuditMetadata,
  validateClaimReview,
} from "../src/lib/claimValidation.js";
import {
  buildAnalysisResult,
  buildConsolidatedDocument,
  buildSummaryUpdate,
  containsGeneratedAnalysis,
} from "../src/lib/analysisPersistence.js";

const validClaim = {
  claim_name: "Williams v. Thompson Logistics, LLC",
  claim_number: "CA-2024-08-14732",
  date_of_loss: "2024-03-15",
  jurisdiction: "California",
  line_of_business: "Commercial Auto",
  claim_file_text: "Fictional claim file text for automated testing.",
};

assert.equal(
  normalizeClaimNumber(" ca-2024 08-14732 "),
  "CA20240814732",
  "Claim numbers should normalize consistently for duplicate detection"
);

assert.equal(
  validateClaimReview(validClaim).valid,
  true,
  "A complete supported claim should pass validation"
);

const missingRequired = validateClaimReview({});
assert.equal(missingRequired.valid, false);
assert.equal(
  missingRequired.errors.length,
  6,
  "All six required claim fields should be reported"
);

assert.equal(
  validateClaimReview({ status: "not-a-status" }, { partial: true }).valid,
  false,
  "Unsupported statuses should be rejected"
);

assert.equal(
  validateClaimReview({ readiness_score: 101 }, { partial: true }).valid,
  false,
  "Readiness scores outside 0-100 should be rejected"
);

assert.deepEqual(
  pickWritableClaimFields({
    claim_name: "Updated Claim",
    status: "reviewed",
    follow_up_messages: "[]",
    executive_summary: "Stored in ClaimAnalysis instead",
    created_by_id: "attempted-overwrite",
    admin: true,
  }),
  {
    claim_name: "Updated Claim",
    status: "reviewed",
    follow_up_messages: "[]",
  },
  "Only approved core claim fields should be writable"
);

assert.deepEqual(
  sanitizeAuditMetadata({
    claim_number: "CA-2024-08-14732",
    claim_file_text: "Sensitive claim narrative",
    medical_timeline: "Sensitive treatment details",
    structured: { should: "not be serialized" },
  }),
  {
    claim_number: "CA-2024-08-14732",
    structured: "[structured value omitted]",
  },
  "Audit metadata should omit sensitive claim content"
);

assert.deepEqual(
  getChangedFields(
    { status: "draft", jurisdiction: "Georgia" },
    { status: "reviewed", jurisdiction: "Georgia", version: 2 }
  ).sort(),
  ["status", "version"],
  "History records should identify only changed values"
);

assert.equal(
  containsGeneratedAnalysis({ executive_summary: "Generated summary" }),
  true,
  "Generated report content should trigger ClaimAnalysis persistence"
);

assert.equal(
  containsGeneratedAnalysis({ status: "archived" }),
  false,
  "A lifecycle-only update should not create a new analysis version"
);

assert.deepEqual(
  buildAnalysisResult({
    executive_summary: "Generated summary",
    readiness_categories: '[{"category":"Liability","status":"Complete"}]',
    claim_knowledge: '{"claim_identity":{"claim_number":"CA-1"}}',
    status: "reviewed",
  }),
  {
    executive_summary: "Generated summary",
    readiness_categories: [{ category: "Liability", status: "Complete" }],
    claim_knowledge: { claim_identity: { claim_number: "CA-1" } },
  },
  "Structured report fields should be stored as structured analysis data"
);

assert.deepEqual(
  buildSummaryUpdate({
    status: "reviewed",
    readiness_score: 88,
    venue_risk_level: "High",
    executive_summary: "Do not duplicate full report text in the core record",
  }),
  {
    status: "reviewed",
    readiness_score: 88,
    venue_risk_level: "High",
  },
  "Only query-friendly analysis summaries should be mirrored to ClaimReview"
);

assert.deepEqual(
  buildConsolidatedDocument(validClaim, validClaim),
  {
    name: "CA-2024-08-14732-consolidated-file.txt",
    documentType: "Consolidated Claim File Text",
    mimeType: "text/plain",
    size: validClaim.claim_file_text.length,
    text: validClaim.claim_file_text,
    status: "processed",
  },
  "Claim text should be transformed into a related document record"
);

console.log("Database layer tests passed: 13 assertions completed successfully.");
