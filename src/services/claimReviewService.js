import { base44 } from "@/api/base44Client";
import { CLAIM_REVIEW_SCHEMA, SECTION_PROMPTS } from "@/config/claimReviewConfig";
import { AppError, normalizeError } from "@/lib/appError";
import { logAuditEvent } from "@/lib/auditLogger";

function buildPrompt(form, selectedSections, documents) {
  const sectionInstructions = selectedSections.map((key) => SECTION_PROMPTS[key]).filter(Boolean).join("\n\n");
  const processed = documents.filter((document) => document.status === "processed");
  const documentSummary = processed.map((document) => `- ${document.name} (${document.documentType || document.mimeType})`).join("\n");

  return `You are a professional insurance claims review assistant. Analyze the claim package and produce a structured claim review.

RULES:
- Use only facts in the supplied claim text and documents. Never invent facts.
- Clearly distinguish factual findings, unresolved questions, and recommendations.
- If information is missing, explain what is missing and how it limits the analysis.
- Do not provide legal advice or fabricate case law, verdicts, settlement data, or jurisdictional facts.
- Reconcile duplicate information and identify conflicts between documents.

CLAIM DETAILS:
Claim Name: ${form.claim_name}
Claim Number: ${form.claim_number}
Date of Loss: ${form.date_of_loss}
Jurisdiction: ${form.jurisdiction}
Line of Business: ${form.line_of_business}
Insured: ${form.insured_name || "Not provided"}
Claimant: ${form.claimant_name || "Not provided"}
Policy Limits: ${form.policy_limits || "Not provided"}
Current Demand: ${form.current_demand || "Not provided"}
Reserve Amount: ${form.reserve_amount || "Not provided"}
Defense Counsel: ${form.defense_counsel || "Not provided"}
Reviewer Notes: ${form.reviewer_notes || "None"}

DOCUMENTS (${processed.length}):
${documentSummary || "No processed documents; pasted claim text supplied."}

CLAIM FILE TEXT:
${form.claim_file_text}

GENERATE THESE SECTIONS:
${sectionInstructions}

Always include venue_risk_level, liability_allocation_summary, readiness_score, readiness_categories, missing_requirements, and readiness_recommendation.`;
}

export async function submitClaimReview({ form, selectedSections, documents }) {
  let review = null;
  try {
    review = await base44.entities.ClaimReview.create({ ...form, selected_sections: selectedSections, status: "analyzing" });
    await logAuditEvent("claim_review_create", { relatedClaimId: review.id, metadata: { claim_name: form.claim_name, claim_number: form.claim_number } });
    await logAuditEvent("document_upload", { relatedClaimId: review.id, metadata: { document_count: documents.filter((d) => d.status === "processed").length } });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(form, selectedSections, documents),
      response_json_schema: CLAIM_REVIEW_SCHEMA,
    });
    if (!result || typeof result !== "object") throw new AppError("Invalid analysis response", { code: "INVALID_ANALYSIS_RESPONSE", userMessage: "The analysis returned an invalid response. Please try again." });

    await base44.entities.ClaimReview.update(review.id, {
      ...result,
      readiness_categories: JSON.stringify(result.readiness_categories || []),
      missing_requirements: JSON.stringify(result.missing_requirements || []),
      status: "reviewed",
    });
    await logAuditEvent("report_generation", { relatedClaimId: review.id, metadata: { success: true } });
    return review.id;
  } catch (error) {
    const normalized = normalizeError(error, "ClaimIntel could not complete the analysis. Review the claim information and try again.");
    if (review?.id) {
      await base44.entities.ClaimReview.update(review.id, { status: "failed" }).catch(() => null);
    }
    await logAuditEvent("report_generation", { success: false, relatedClaimId: review?.id || null, metadata: { error_code: normalized.code } });
    throw normalized;
  }
}
