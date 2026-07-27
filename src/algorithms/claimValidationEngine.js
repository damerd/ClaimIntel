import { PriorityQueue } from "./PriorityQueue.js";
import { buildDocumentIndex, sourcesForTokens } from "./documentIndex.js";
import {
  dateVariants,
  digitsOnly,
  meaningfulTokenMatch,
  normalizeText,
  uniqueTokens,
} from "./textNormalizer.js";

export const SEVERITY_PRIORITY = Object.freeze({
  Critical: 100,
  High: 80,
  Medium: 50,
  Low: 20,
});

export const CATEGORY_WEIGHTS = new Map([
  ["Claim Identity", 0.15],
  ["Coverage", 0.25],
  ["Liability", 0.20],
  ["Medical Documentation", 0.15],
  ["Damages Documentation", 0.15],
  ["Litigation and Venue", 0.10],
]);

const LINE_OF_BUSINESS_TERMS = new Map([
  ["commercial auto", ["commercial auto", "auto liability", "truck", "vehicle", "collision"]],
  ["personal auto", ["personal auto", "auto liability", "automobile", "vehicle", "car", "collision"]],
  ["general liability", ["general liability", "premises liability", "premises", "negligence", "liability"]],
  ["workers compensation", ["workers compensation", "workers comp", "employee injury", "workplace", "employer"]],
  ["property", ["property", "building", "fire", "water damage", "wind", "theft"]],
  ["professional liability", ["professional liability", "errors and omissions", "malpractice", "professional services"]],
  ["product liability", ["product liability", "defective product", "product defect", "failure to warn"]],
  ["other", []],
]);

const CATEGORY_EVIDENCE = new Map([
  ["Coverage", ["policy", "coverage", "limit", "deductible", "sir", "exclusion", "endorsement"]],
  ["Liability", ["liability", "negligence", "fault", "accident", "collision", "incident", "witness", "police"]],
  ["Medical Documentation", ["injury", "medical", "treatment", "hospital", "diagnosis", "physician", "therapy"]],
  ["Damages Documentation", ["damage", "damages", "medical bills", "lost wages", "demand", "reserve", "invoice"]],
  ["Litigation and Venue", ["litigation", "lawsuit", "complaint", "court", "venue", "counsel", "attorney"]],
]);

const MISSING_REQUIREMENTS = [
  {
    field: "insured_name",
    label: "Insured name",
    category: "Claim Identity",
    severity: "Medium",
    recommendation: "Confirm the insured entity before completing liability and coverage analysis.",
    evidenceTerms: ["named insured", "insured driver", "insured vehicle", "insured"],
  },
  {
    field: "claimant_name",
    label: "Claimant name",
    category: "Claim Identity",
    severity: "Medium",
    recommendation: "Confirm the claimant identity before completing damages and medical review.",
    evidenceTerms: ["claimant information", "claimant name", "claimant"],
  },
  {
    field: "policy_limits",
    label: "Policy limits",
    category: "Coverage",
    severity: "High",
    recommendation: "Obtain the declarations page or verified policy limits before evaluating exposure.",
    evidenceTerms: ["policy limits", "combined single limit", "coverage limit"],
  },
  {
    field: "current_demand",
    label: "Current demand",
    category: "Damages Documentation",
    severity: "Low",
    recommendation: "Confirm whether a demand has been received and document the amount or status.",
    evidenceTerms: ["current demand", "settlement demand", "written demand", "demand letter", "demand for"],
  },
  {
    field: "reserve_amount",
    label: "Reserve amount",
    category: "Damages Documentation",
    severity: "Low",
    recommendation: "Confirm the current reserve so the analysis can identify reserve-to-exposure gaps.",
    evidenceTerms: ["reserve history", "current reserve", "reserve increased", "reserve set", "reserve is"],
  },
];

const REQUIRED_IDENTITY_FIELDS = [
  "claim_name",
  "claim_number",
  "date_of_loss",
  "jurisdiction",
  "line_of_business",
];

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function phrasePresent(index, value) {
  const normalized = normalizeText(value);
  return Boolean(normalized && index.combinedNormalizedText.includes(normalized));
}

function anyPhrasePresent(index, phrases) {
  return phrases.some((phrase) => phrasePresent(index, phrase));
}

function evidenceScore(index, terms) {
  if (!terms.length) return 0;
  const matches = terms.reduce(
    (count, term) => count + (phrasePresent(index, term) ? 1 : 0),
    0,
  );
  return clampScore((matches / Math.min(3, terms.length)) * 100);
}

function buildIssue({
  id,
  type = "Conflict",
  category,
  field,
  enteredValue = "",
  detectedValues = [],
  severity,
  explanation,
  recommendation,
  sources = [],
}) {
  return {
    id,
    type,
    category,
    field,
    enteredValue,
    detectedValues,
    severity,
    priority: SEVERITY_PRIORITY[severity] ?? 0,
    explanation,
    recommendation,
    sources: sources.map((source) => source.name),
  };
}

function sourcesForValue(index, value) {
  return sourcesForTokens(index, uniqueTokens(value));
}

function addIssue(issueMap, queue, issue) {
  if (!issueMap.has(issue.id)) {
    issueMap.set(issue.id, issue);
    queue.enqueue(issue, issue.priority);
  }
}

function calculateBaseCategoryScores(form, index) {
  const identityPresent = REQUIRED_IDENTITY_FIELDS.filter((field) => form[field]).length;
  const identityFormScore = (identityPresent / REQUIRED_IDENTITY_FIELDS.length) * 60;
  const identityEvidenceFields = [
    form.claim_name,
    form.claim_number,
    form.date_of_loss,
    form.jurisdiction,
    form.line_of_business,
  ].filter(Boolean);
  const identityEvidenceMatches = identityEvidenceFields.filter((value) => {
    if (value === form.date_of_loss) {
      return dateVariants(value).some((variant) => index.combinedNormalizedText.includes(variant));
    }
    return phrasePresent(index, value) || meaningfulTokenMatch(value, index.allTokens).ratio >= 0.5;
  }).length;
  const identityEvidenceScore = identityEvidenceFields.length
    ? (identityEvidenceMatches / identityEvidenceFields.length) * 40
    : 0;

  const coverageEvidence = evidenceScore(index, CATEGORY_EVIDENCE.get("Coverage"));
  const liabilityEvidence = evidenceScore(index, CATEGORY_EVIDENCE.get("Liability"));
  const medicalEvidence = evidenceScore(index, CATEGORY_EVIDENCE.get("Medical Documentation"));
  const damagesEvidence = evidenceScore(index, CATEGORY_EVIDENCE.get("Damages Documentation"));
  const litigationEvidence = evidenceScore(index, CATEGORY_EVIDENCE.get("Litigation and Venue"));

  return new Map([
    ["Claim Identity", clampScore(identityFormScore + identityEvidenceScore)],
    ["Coverage", clampScore((form.policy_limits ? 30 : 0) + coverageEvidence * 0.7)],
    ["Liability", clampScore(liabilityEvidence)],
    ["Medical Documentation", clampScore(medicalEvidence)],
    [
      "Damages Documentation",
      clampScore(
        (form.current_demand ? 20 : 0)
          + (form.reserve_amount ? 20 : 0)
          + damagesEvidence * 0.6,
      ),
    ],
    [
      "Litigation and Venue",
      clampScore((form.jurisdiction ? 30 : 0) + (form.defense_counsel ? 20 : 0) + litigationEvidence * 0.5),
    ],
  ]);
}

function applyIssueDeductions(categoryScores, issues) {
  const deductionBySeverity = {
    Critical: 50,
    High: 30,
    Medium: 15,
    Low: 8,
  };

  for (const issue of issues) {
    const current = categoryScores.get(issue.category);
    if (current === undefined) continue;
    categoryScores.set(
      issue.category,
      clampScore(current - (deductionBySeverity[issue.severity] ?? 0)),
    );
  }
}

function calculateReadinessScore(categoryScores) {
  let score = 0;
  for (const [category, weight] of CATEGORY_WEIGHTS) {
    score += (categoryScores.get(category) ?? 0) * weight;
  }
  return clampScore(score);
}

function statusFromResults(readinessScore, issues, insufficientInformation) {
  if (insufficientInformation) return "Insufficient Information";
  if (issues.some((issue) => issue.severity === "Critical") || readinessScore < 40) return "High Risk";
  if (issues.some((issue) => issue.severity === "High") || readinessScore < 75) return "Needs Review";
  return "Clear";
}

function validateIdentityFields(form, index, issueMap, queue) {
  const nameFields = [
    ["claim_name", "Claim name", 0.5, "High"],
    ["insured_name", "Insured name", 0.5, "High"],
    ["claimant_name", "Claimant name", 0.5, "High"],
  ];

  for (const [field, label, threshold, severity] of nameFields) {
    const value = form[field];
    if (!value) continue;
    const match = meaningfulTokenMatch(value, index.allTokens);
    if (match.total > 0 && match.ratio < threshold) {
      addIssue(issueMap, queue, buildIssue({
        id: `${field}-mismatch`,
        category: "Claim Identity",
        field,
        enteredValue: value,
        severity,
        explanation: `${label} is not sufficiently supported by the indexed claim text.`,
        recommendation: `Confirm the ${label.toLowerCase()} and verify that the correct claim documents were uploaded.`,
        sources: sourcesForValue(index, value),
      }));
    }
  }

  if (form.claim_number) {
    const normalizedClaimNumber = normalizeText(form.claim_number);
    const compactClaimNumber = digitsOnly(form.claim_number);
    const supported = index.combinedNormalizedText.includes(normalizedClaimNumber)
      || (compactClaimNumber.length >= 5 && digitsOnly(index.combinedNormalizedText).includes(compactClaimNumber));
    if (!supported) {
      addIssue(issueMap, queue, buildIssue({
        id: "claim-number-mismatch",
        category: "Claim Identity",
        field: "claim_number",
        enteredValue: form.claim_number,
        severity: "High",
        explanation: "The entered claim number does not appear in the indexed claim text.",
        recommendation: "Verify the claim number and confirm that the uploaded documents belong to this claim.",
      }));
    }
  }

  if (form.date_of_loss) {
    const supported = dateVariants(form.date_of_loss)
      .some((variant) => index.combinedNormalizedText.includes(variant));
    if (!supported) {
      addIssue(issueMap, queue, buildIssue({
        id: "date-of-loss-mismatch",
        category: "Claim Identity",
        field: "date_of_loss",
        enteredValue: form.date_of_loss,
        severity: "High",
        explanation: "The entered date of loss was not found in a supported date format within the claim text.",
        recommendation: "Confirm the date of loss before relying on timeline or coverage analysis.",
      }));
    }
  }

  if (form.jurisdiction && !phrasePresent(index, form.jurisdiction)) {
    addIssue(issueMap, queue, buildIssue({
      id: "jurisdiction-mismatch",
      category: "Litigation and Venue",
      field: "jurisdiction",
      enteredValue: form.jurisdiction,
      severity: "High",
      explanation: "The entered jurisdiction does not appear in the indexed claim text.",
      recommendation: "Confirm the correct jurisdiction before completing venue or legal analysis.",
    }));
  }

  if (form.line_of_business) {
    const normalizedLine = normalizeText(form.line_of_business);
    const terms = LINE_OF_BUSINESS_TERMS.get(normalizedLine) ?? [normalizedLine];
    if (terms.length && !anyPhrasePresent(index, terms)) {
      addIssue(issueMap, queue, buildIssue({
        id: "line-of-business-mismatch",
        category: "Liability",
        field: "line_of_business",
        enteredValue: form.line_of_business,
        severity: "High",
        explanation: "The selected line of business is not supported by expected terms in the claim text.",
        recommendation: "Confirm the line of business and verify that the correct claim materials were uploaded.",
      }));
    }
  }
}

function numericValuePresent(index, value) {
  const expectedDigits = digitsOnly(value);
  if (expectedDigits.length < 3) return true;

  return index.sources.some((source) => {
    const numericCandidates = String(source.text).match(/\$?\s*\d[\d,]*(?:\.\d{1,2})?/g) ?? [];
    return numericCandidates.some((candidate) => digitsOnly(candidate) === expectedDigits);
  });
}

function validateFinancialFields(form, index, issueMap, queue) {
  const financialFields = [
    ["policy_limits", "Policy limits", "Coverage", "High"],
    ["current_demand", "Current demand", "Damages Documentation", "Medium"],
    ["reserve_amount", "Reserve amount", "Damages Documentation", "Medium"],
  ];

  for (const [field, label, category, severity] of financialFields) {
    const value = form[field];
    if (!value) continue;
    if (!numericValuePresent(index, value)) {
      addIssue(issueMap, queue, buildIssue({
        id: `${field}-unsupported`,
        category,
        field,
        enteredValue: value,
        severity,
        explanation: `${label} is entered in the form but the numeric value is not supported by the indexed claim text.`,
        recommendation: `Confirm the ${label.toLowerCase()} against the source document before relying on the analysis.`,
      }));
    }
  }
}

function addMissingRequirements(form, index, issueMap, queue) {
  for (const requirement of MISSING_REQUIREMENTS) {
    if (form[requirement.field]) continue;
    if (requirement.evidenceTerms?.some((term) => phrasePresent(index, term))) continue;
    addIssue(issueMap, queue, buildIssue({
      id: `missing-${requirement.field}`,
      type: "Missing Requirement",
      category: requirement.category,
      field: requirement.field,
      severity: requirement.severity,
      explanation: `${requirement.label} was not provided.`,
      recommendation: requirement.recommendation,
    }));
  }
}

/**
 * Deterministically validates claim form data against uploaded claim text.
 *
 * Complexity:
 * - Index construction: O(T), where T is the total number of tokens.
 * - Rule evaluation: O(F + R), where F is the number of form fields and R is
 *   the number of fixed validation rules.
 * - Priority ordering: O(I log I), where I is the number of detected issues.
 */
export function validateClaimPackage({
  form = {},
  documents = [],
  minimumTextLength = 200,
} = {}) {
  const index = buildDocumentIndex({
    claimText: form.claim_file_text ?? "",
    documents,
  });

  const issueMap = new Map();
  const issueQueue = new PriorityQueue();
  const textLength = index.combinedNormalizedText.length;
  const insufficientInformation = textLength < minimumTextLength;

  if (insufficientInformation) {
    addIssue(issueMap, issueQueue, buildIssue({
      id: "insufficient-claim-text",
      type: "Missing Requirement",
      category: "Claim Identity",
      field: "claim_file_text",
      severity: "Critical",
      explanation: `The indexed claim text contains ${textLength} characters; at least ${minimumTextLength} are required for reliable validation.`,
      recommendation: "Upload or paste enough claim documentation to support a reliable comparison.",
    }));
  } else {
    validateIdentityFields(form, index, issueMap, issueQueue);
    validateFinancialFields(form, index, issueMap, issueQueue);
    addMissingRequirements(form, index, issueMap, issueQueue);
  }

  const issues = issueQueue.toSortedArray();
  const categoryScores = calculateBaseCategoryScores(form, index);
  applyIssueDeductions(categoryScores, issues);
  const readinessScore = insufficientInformation ? 0 : calculateReadinessScore(categoryScores);
  const overallStatus = statusFromResults(readinessScore, issues, insufficientInformation);

  const categoryResults = [...CATEGORY_WEIGHTS.keys()].map((category) => ({
    category,
    score: categoryScores.get(category) ?? 0,
    status: (categoryScores.get(category) ?? 0) >= 75
      ? "Ready"
      : (categoryScores.get(category) ?? 0) >= 50
        ? "Needs Review"
        : "Incomplete",
  }));

  return {
    overallStatus,
    readinessScore,
    issues,
    conflicts: issues.filter((issue) => issue.type === "Conflict"),
    missingRequirements: issues.filter((issue) => issue.type === "Missing Requirement"),
    blockingIssues: issues.filter((issue) => issue.severity === "Critical" || issue.severity === "High"),
    categoryResults,
    statistics: {
      sourceCount: index.sourceCount,
      uniqueTokenCount: index.uniqueTokenCount,
      indexedCharacterCount: textLength,
      issueCount: issues.length,
    },
  };
}
