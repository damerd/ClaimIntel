import assert from "node:assert/strict";
import {
  getChangedFields,
  normalizeClaimNumber,
  pickWritableClaimFields,
  sanitizeAuditMetadata,
  validateClaimReview,
} from "../src/lib/claimValidation.js";

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

assert.deepEqual(
  pickWritableClaimFields({
    claim_name: "Updated Claim",
    status: "reviewed",
    created_by_id: "attempted-overwrite",
    admin: true,
  }),
  {
    claim_name: "Updated Claim",
    status: "reviewed",
  },
  "Server-controlled and unknown fields should not be writable"
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

console.log("Database layer tests passed: 7 assertions completed successfully.");
