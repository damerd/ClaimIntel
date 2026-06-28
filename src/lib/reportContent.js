// Shared report content definitions for carrier-style report template

export const CARRIER_SECTIONS = [
  { key: "executive_summary", title: "Executive Summary" },
  { key: "liability_assessment", title: "Liability Assessment" },
  { key: "coverage_summary", title: "Coverage Analysis" },
  { key: "coverage_issues", title: "Coverage Issues" },
  { key: "venue_exposure_analysis", title: "Venue Analysis" },
  { key: "exposure_analysis", title: "Exposure Analysis" },
  { key: "damages_summary", title: "Damages Overview" },
  { key: "medical_timeline", title: "Medical Timeline", fallbackKey: "medical_treatment_summary" },
  { key: "strengths", title: "Strengths" },
  { key: "weaknesses", title: "Weaknesses" },
  { key: "missing_information", title: "Missing Information" },
  { key: "recommended_next_steps", title: "Recommended Next Steps" },
  { key: "suggested_follow_up_questions", title: "Suggested Follow-Up Questions" },
  { key: "overall_claim_assessment", title: "Overall Claim Assessment" },
  { key: "supervisor_review", title: "Supervisor Review" },
  // Legacy sections — shown if old reports contain them
  { key: "strengths_and_weaknesses", title: "Strengths and Weaknesses", legacy: true },
  { key: "settlement_evaluation", title: "Settlement Evaluation", legacy: true },
  { key: "red_flags", title: "Red Flags", legacy: true },
];

export function getActiveSections(review) {
  if (!review) return [];
  const selected = review.selected_sections || [];
  const hasSelection = selected.length > 0;
  const sections = [];

  for (const def of CARRIER_SECTIONS) {
    // Skip legacy strengths_and_weaknesses if new split fields exist
    if (def.key === "strengths_and_weaknesses" && (review.strengths || review.weaknesses)) continue;

    // Check selection (skip for legacy — always show if content exists)
    if (hasSelection && !def.legacy) {
      if (!selected.includes(def.key)) {
        if (def.fallbackKey && selected.includes(def.fallbackKey)) {
          // OK — legacy field name was selected
        } else {
          continue;
        }
      }
    }

    const content = review[def.key] || (def.fallbackKey && review[def.fallbackKey]) || "";
    if (!content || !content.trim()) continue;

    sections.push({ ...def, content });
  }

  return sections;
}

export function getClaimOverview(review) {
  if (!review) return [];
  const fields = [
    { label: "Claim Name", value: review.claim_name },
    { label: "Claim Number", value: review.claim_number },
    { label: "Insured", value: review.insured_name },
    { label: "Claimant", value: review.claimant_name },
    { label: "Date of Loss", value: review.date_of_loss },
    { label: "Jurisdiction", value: review.jurisdiction },
    { label: "Line of Business", value: review.line_of_business },
    { label: "Policy Limits", value: review.policy_limits },
    { label: "Current Demand", value: review.current_demand },
    { label: "Reserve Amount", value: review.reserve_amount },
    { label: "Defense Counsel", value: review.defense_counsel },
    { label: "Venue Risk Level", value: review.venue_risk_level },
    { label: "Confidence Level", value: review.confidence_level },
    { label: "Liability Allocation", value: review.liability_allocation_summary },
  ];
  return fields.filter((f) => f.value && String(f.value).trim());
}