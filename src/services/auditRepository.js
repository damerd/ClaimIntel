import { base44 } from "@/api/base44Client";
import { sanitizeAuditMetadata } from "@/lib/claimValidation";

/**
 * Records a nonblocking audit event without exposing claim-file or medical content.
 * The return value lets callers and tests detect logging failures without breaking
 * the primary user workflow.
 */
export async function recordAuditEvent(
  action,
  {
    success = true,
    relatedClaimId = null,
    metadata = {},
    errorCode = null,
  } = {}
) {
  try {
    const user = await base44.auth.me().catch(() => null);
    const sanitizedMetadata = sanitizeAuditMetadata({
      ...metadata,
      ...(errorCode ? { error_code: errorCode } : {}),
    });

    const record = await base44.entities.AuditLog.create({
      action,
      success,
      related_claim_id: relatedClaimId,
      user_email: user?.email || "unknown",
      metadata: JSON.stringify(sanitizedMetadata),
    });

    return { success: true, record };
  } catch (error) {
    console.warn("Audit event could not be persisted", {
      action,
      relatedClaimId,
      error: error?.message || "Unknown audit error",
    });
    return { success: false, error };
  }
}
