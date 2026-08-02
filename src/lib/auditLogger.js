import { recordAuditEvent } from "@/services/auditRepository";

/**
 * Backward-compatible audit helper used by existing pages and components.
 * New code should import recordAuditEvent directly from auditRepository.
 */
export function logAuditEvent(
  action,
  { success = true, relatedClaimId = null, metadata = {} } = {}
) {
  return recordAuditEvent(action, {
    success,
    relatedClaimId,
    metadata,
  });
}
