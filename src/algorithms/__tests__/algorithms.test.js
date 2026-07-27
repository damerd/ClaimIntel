import test from "node:test";
import assert from "node:assert/strict";

import { PriorityQueue } from "../PriorityQueue.js";
import { buildDocumentIndex } from "../documentIndex.js";
import { meaningfulTokenMatch, uniqueTokens } from "../textNormalizer.js";
import { validateClaimPackage } from "../claimValidationEngine.js";

const matchingText = `
Claim Number CA-2026-00421. Smith v. ABC Trucking Corporation.
The loss occurred on July 14, 2026 in Georgia. This commercial auto collision
involved insured ABC Trucking and claimant John Smith. The police report and
witness statements address liability and negligence. The policy provides a
$1,000,000 combined single limit. Medical records document a shoulder injury,
hospital evaluation, diagnosis, therapy, and treatment. Medical bills and lost
wages are being evaluated. The current demand is $850,000 and the reserve is
$500,000. Litigation has not been filed, but venue and defense counsel will be
reviewed if a complaint is served. Additional accident investigation remains open.
`;

const completeForm = {
  claim_name: "Smith v. ABC Trucking Corp",
  claim_number: "CA-2026-00421",
  date_of_loss: "2026-07-14",
  jurisdiction: "Georgia",
  line_of_business: "Commercial Auto",
  claim_file_text: matchingText,
  insured_name: "ABC Trucking Corporation",
  claimant_name: "John Smith",
  policy_limits: "$1,000,000 CSL",
  current_demand: "$850,000",
  reserve_amount: "$500,000",
  defense_counsel: "Pending assignment",
};

test("priority queue returns higher-priority items first", () => {
  const queue = new PriorityQueue();
  queue.enqueue("low", 20).enqueue("high", 80).enqueue("medium", 50);
  assert.deepEqual(queue.toSortedArray(), ["high", "medium", "low"]);
});

test("priority queue preserves insertion order for equal priorities", () => {
  const queue = new PriorityQueue();
  queue.enqueue("first", 50).enqueue("second", 50).enqueue("third", 50);
  assert.deepEqual(queue.toSortedArray(), ["first", "second", "third"]);
});

test("document index maps tokens to their source documents", () => {
  const index = buildDocumentIndex({
    documents: [
      { id: "a", name: "Police Report", status: "processed", extractedText: "Georgia collision" },
      { id: "b", name: "Policy", status: "processed", extractedText: "Georgia policy limit" },
    ],
  });

  assert.equal(index.tokenSources.get("georgia").size, 2);
  assert.deepEqual([...index.tokenSources.get("collision")], ["a"]);
});

test("name matching ignores legal suffixes and common stop words", () => {
  const tokens = uniqueTokens("The ABC Trucking Corporation is the insured entity.");
  const match = meaningfulTokenMatch("ABC Trucking, LLC", tokens);
  assert.equal(match.ratio, 1);
});

test("matching claim information does not create identity conflicts", () => {
  const result = validateClaimPackage({ form: completeForm });
  const identityConflicts = result.conflicts.filter((issue) => issue.category === "Claim Identity");
  assert.deepEqual(identityConflicts, []);
});

test("different jurisdiction creates a high-priority conflict", () => {
  const result = validateClaimPackage({
    form: { ...completeForm, jurisdiction: "Florida" },
  });

  const issue = result.conflicts.find((entry) => entry.id === "jurisdiction-mismatch");
  assert.equal(issue.severity, "High");
  assert.equal(result.blockingIssues[0].id, "jurisdiction-mismatch");
});

test("line-of-business synonyms are recognized", () => {
  const result = validateClaimPackage({
    form: {
      ...completeForm,
      claim_file_text: matchingText.replace("commercial auto", "auto liability"),
    },
  });

  assert.equal(result.conflicts.some((issue) => issue.id === "line-of-business-mismatch"), false);
});

test("duplicate issue identifiers are not returned", () => {
  const result = validateClaimPackage({
    form: { ...completeForm, jurisdiction: "Florida" },
  });
  const ids = result.issues.map((issue) => issue.id);
  assert.equal(ids.length, new Set(ids).size);
});

test("issues are returned in descending severity order", () => {
  const result = validateClaimPackage({
    form: {
      ...completeForm,
      jurisdiction: "Florida",
      policy_limits: "$2,000,000",
      current_demand: "$900,000",
      defense_counsel: "",
    },
  });

  const priorities = result.issues.map((issue) => issue.priority);
  assert.deepEqual(priorities, [...priorities].sort((a, b) => b - a));
});

test("missing required evidence reduces the readiness score", () => {
  const complete = validateClaimPackage({ form: completeForm });
  const incomplete = validateClaimPackage({
    form: {
      ...completeForm,
      policy_limits: "",
      current_demand: "",
      reserve_amount: "",
      defense_counsel: "",
    },
  });

  assert.ok(incomplete.readinessScore < complete.readinessScore);
  assert.ok(incomplete.missingRequirements.length >= 4);
});

test("readiness score remains within zero and one hundred", () => {
  const result = validateClaimPackage({ form: completeForm });
  assert.ok(result.readinessScore >= 0);
  assert.ok(result.readinessScore <= 100);
});

test("short claim text returns insufficient information instead of false certainty", () => {
  const result = validateClaimPackage({
    form: { ...completeForm, claim_file_text: "Short note." },
  });

  assert.equal(result.overallStatus, "Insufficient Information");
  assert.equal(result.readinessScore, 0);
  assert.equal(result.issues[0].id, "insufficient-claim-text");
});
