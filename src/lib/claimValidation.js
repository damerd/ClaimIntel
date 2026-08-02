export const CLAIM_STATUSES = Object.freeze([
  "draft",
  "analyzing",
  "reviewed",
  "archived",
  "failed",
]);

export const LINES_OF_BUSINESS = Object.freeze([
  "Commercial Auto",
  "Personal Auto",
  "General Liability",
  "Workers Compensation",
  "Property",
  "Professional Liability",
  "Product Liability",
  "Other",
]);

export const REQUIRED_CLAIM_FIELDS = Object.freeze([
  "claim_name",
  "claim_number",
  "date_of_loss",
  "jurisdiction",
  "line_of_business",
  "claim_file_text",
]);

export const WRITABLE_CLAIM_FIELDS = Object.freeze([
  ...REQUIRED_CLAIM_FIELDS,
  "insured_name",
  "claimant_name",
  "policy_limits",
  "current_demand",
  "reserve_amount",
  "defense_counsel",
  "reviewer_notes",
  "selected_sections",
  "status",
  "record_status",
  "deleted_at",
  "deletion_reason",
  "last_activity_at",
  "confidence_level",
  "venue_risk_level",
  "liability_allocation_summary",
  "readiness_score",
  "readiness_recommendation",
  "follow_up_messages",
]);

const SENSITIVE_AUDIT_KEYS = new Set([
  "claim_file_text",
  "extracted_text",
  "analysis_payload",
  "claim_knowledge",
  "medical_timeline",
  "validation_engine_data",
  "comparative_verdict_data",
  "follow_up_messages",
]);

export function normalizeClaimNumber(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function pickWritableClaimFields(input = {}) {
  return WRITABLE_CLAIM_FIELDS.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      result[field] = input[field];
    }
    return result;
  }, {});
}

export function validateClaimReview(input = {}, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    for (const field of REQUIRED_CLAIM_FIELDS) {
      const value = input[field];
      if (value == null || String(value).trim() === "") {
        errors.push(`${field} is required`);
      }
    }
  }

  if (input.claim_number != null && normalizeClaimNumber(input.claim_number).length < 3) {
    errors.push("claim_number must contain at least three letters or numbers");
  }

  if (input.line_of_business != null && !LINES_OF_BUSINESS.includes(input.line_of_business)) {
    errors.push("line_of_business is not supported");
  }

  if (input.status != null && !CLAIM_STATUSES.includes(input.status)) {
    errors.push("status is not valid");
  }

  if (input.record_status != null && !["active", "deleted"].includes(input.record_status)) {
    errors.push("record_status must be active or deleted");
  }

  if (input.date_of_loss != null && Number.isNaN(Date.parse(input.date_of_loss))) {
    errors.push("date_of_loss must be a valid date");
  }

  if (
    input.readiness_score != null &&
    (!Number.isFinite(Number(input.readiness_score)) ||
      Number(input.readiness_score) < 0 ||
      Number(input.readiness_score) > 100)
  ) {
    errors.push("readiness_score must be between 0 and 100");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidClaimReview(input, options) {
  const result = validateClaimReview(input, options);
  if (!result.valid) {
    const error = new Error(result.errors.join("; "));
    error.name = "ClaimValidationError";
    error.validationErrors = result.errors;
    throw error;
  }
}

export function sanitizeAuditMetadata(metadata = {}) {
  return Object.entries(metadata).reduce((result, [key, value]) => {
    if (SENSITIVE_AUDIT_KEYS.has(key)) return result;

    if (typeof value === "string") {
      result[key] = value.slice(0, 250);
    } else if (
      value == null ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.slice(0, 20).map((item) =>
        typeof item === "string" ? item.slice(0, 100) : String(item).slice(0, 100)
      );
    } else {
      result[key] = "[structured value omitted]";
    }

    return result;
  }, {});
}

export function buildClaimSnapshot(claim = {}) {
  const trackedFields = [
    "claim_name",
    "claim_number",
    "date_of_loss",
    "jurisdiction",
    "line_of_business",
    "insured_name",
    "claimant_name",
    "policy_limits",
    "current_demand",
    "reserve_amount",
    "defense_counsel",
    "status",
    "record_status",
    "version",
    "confidence_level",
    "venue_risk_level",
    "liability_allocation_summary",
    "readiness_score",
  ];

  return trackedFields.reduce((snapshot, field) => {
    if (Object.prototype.hasOwnProperty.call(claim, field)) {
      snapshot[field] = claim[field];
    }
    return snapshot;
  }, {});
}

export function getChangedFields(before = {}, after = {}) {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields].filter((field) => before[field] !== after[field]);
}
