import { base44 } from "@/api/base44Client";

/**
 * Logs an audit event to the AuditLog entity.
 * Silent-fails so it never breaks the user's workflow.
 *
 * @param {string} action - The action performed
 * @param {object} options - { success, relatedClaimId, metadata }
 */
export async function logAuditEvent(
  action,
  { success = true, relatedClaimId = null, metadata = {} } = {}
) {
  try {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.AuditLog.create({
      action,
      success,
      related_claim_id: relatedClaimId,
      user_email: user?.email || "unknown",
      metadata: JSON.stringify(metadata),
    });
  } catch (e) {
    // Silent fail — audit logging must never break user flows
  }
}