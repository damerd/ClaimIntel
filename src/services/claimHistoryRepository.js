import { base44 } from "@/api/base44Client";
import {
  buildClaimSnapshot,
  getChangedFields,
} from "@/lib/claimValidation";

export async function appendClaimHistory({
  claimReviewId,
  version,
  eventType,
  before = {},
  after = {},
  changeSummary = "",
}) {
  const user = await base44.auth.me().catch(() => null);
  const beforeSnapshot = buildClaimSnapshot(before);
  const afterSnapshot = buildClaimSnapshot(after);

  return base44.entities.ClaimReviewHistory.create({
    claim_review_id: claimReviewId,
    version,
    event_type: eventType,
    changed_fields: getChangedFields(beforeSnapshot, afterSnapshot),
    before_snapshot: JSON.stringify(beforeSnapshot),
    after_snapshot: JSON.stringify(afterSnapshot),
    change_summary: changeSummary,
    actor_email: user?.email || "unknown",
    occurred_at: new Date().toISOString(),
  });
}

export function listClaimHistory(claimReviewId, limit = 100) {
  return base44.entities.ClaimReviewHistory.filter(
    { claim_review_id: claimReviewId },
    "-version",
    limit
  );
}
