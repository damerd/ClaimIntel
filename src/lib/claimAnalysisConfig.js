export const LINES_OF_BUSINESS = [
  "Commercial Auto", "Personal Auto", "General Liability", "Workers Compensation",
  "Property", "Professional Liability", "Product Liability", "Other",
];

export const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida",
  "Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine",
  "Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska",
  "Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota",
  "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export const SECTION_PROMPTS = {
  executive_summary: "executive_summary: Provide a 2-3 paragraph overview of the claim, parties, loss event, current status, key risks, and key exposures.",
  coverage_summary: "coverage_summary: Summarize coverage, policy type, limits, covered perils, coverage status, exclusions, reservation of rights issues, and missing policy information.",
  coverage_issues: "coverage_issues: Identify coverage gaps, exclusions, reservation of rights concerns, policy interpretation issues, or state that none are apparent from the file.",
  liability_assessment: `liability_assessment: Provide a preliminary liability allocation using this format:\n---\nPRELIMINARY LIABILITY ALLOCATION (based on claim file text only)\n\nInsured: ___%\nClaimant: ___%\nOther/Unknown: ___%\n\nBasis:\n- [facts supporting allocation]\n- [facts that strengthen or weaken insured defense]\n\nIf insufficient information exists, state what is needed. Do not total over 100%. Do not invent facts. Use preliminary language.`,
  damages_summary: "damages_summary: Summarize claimed damages, including medical bills, lost wages, property damage, general damages, demand, reserve, and any missing documentation.",
  medical_timeline: "medical_timeline: Organize medical treatment chronologically by date, provider, diagnosis, treatment, gaps, inconsistencies, and missing records.",
  litigation_status: "litigation_status: Describe legal status, lawsuit status, counsel, court, venue, deadlines, motions, or state that litigation is not shown in the file.",
  venue_exposure_analysis: `venue_exposure_analysis: Evaluate venue/jurisdiction exposure using this format:\n---\nVENUE EXPOSURE ANALYSIS\n\nJurisdiction/Venue: [from file]\nVenue Risk Level: [Low / Moderate / High / Severe / Unknown]\n\nRelevant Factors:\n- [plaintiff or defense friendly tendencies only if supported]\n- [jury verdict risk]\n- [litigation cost risk]\n- [local procedural concerns]\n\nImpact on Claim:\n- [effect on value, settlement pressure, litigation strategy, or trial risk]\n\nDo not cite law or external verdicts unless they are in the file.`,
  exposure_analysis: "exposure_analysis: Analyze policy limits, demand, BI exposure, PD exposure, excess or bad faith risk, worst-case scenario, mitigating factors, aggravating factors, and overall exposure rating.",
  settlement_evaluation: "settlement_evaluation: Evaluate settlement posture, current demand, documented specials, strengths supporting settlement, weaknesses reducing value, and whether a negotiation range can be supported from file facts.",
  strengths: "strengths: List key facts supporting the defense or insured position. Only use facts found in the claim file.",
  weaknesses: "weaknesses: List key facts undermining the defense or insured position. Only use facts found in the claim file.",
  red_flags: "red_flags: List inconsistencies, fraud indicators, coverage issues, litigation risks, investigation gaps, or state that none are apparent.",
  missing_information: "missing_information: List all missing information needed for a complete review and explain why each item matters.",
  recommended_next_steps: "recommended_next_steps: Provide numbered, actionable adjuster recommendations while separating facts from recommendations.",
  suggested_follow_up_questions: "suggested_follow_up_questions: Provide investigative questions about liability, coverage, damages, evidence, strategy, and missing documentation.",
  overall_claim_assessment: "overall_claim_assessment: Provide claim severity, complexity, key takeaways, primary risks, primary opportunities, recommended handling, reserve consideration, and summary statement.",
  supervisor_review: `supervisor_review: Provide a manager-level summary using this format:\n---\nSUPERVISOR REVIEW\n\nCoverage: [Clear / Issues Present / Unknown]\nLiability: [brief preliminary allocation]\nDamages: [Low / Moderate / High / Severe / Unknown]\nVenue: [Low / Moderate / High / Severe / Unknown]\nSettlement: [supported position or insufficient information]\nRecommended Action:\n- [file-specific recommendation]\nAuthority Consideration: [whether authority can be evaluated and what is missing]`,
  comparative_verdict_intelligence: `comparative_verdict_data: Generate a structured JSON object for comparative verdict intelligence. This is decision support only, not legal advice. Do not invent specific verdicts or settlements. If no comparable data exists, say so. Include exposure_snapshot, why_comparables_matter, similarity_breakdown, top_comparable_cases, valuation_drivers, recommended_considerations, comparison_quality_assessment, defense_perspective, and plaintiff_perspective. Use careful language such as "consider reviewing" and "may warrant further review." Never say "settle for" or "this claim is worth."`,
};

export const CLAIM_KNOWLEDGE_INSTRUCTIONS = `
Also create claim_knowledge: a structured JSON object representing the internal Shared Claim Knowledge Layer. It must be based only on claim file text and entered form fields. Use empty strings, empty arrays, or "Unknown" when facts are unavailable. Include:
- claim_identity: { claim_name, claim_number, date_of_loss, jurisdiction, line_of_business, status }
- parties: array of { name, role, organization, relationship_to_claim, confidence }
- policy: { policy_type, policy_number, limits, deductible_or_sir, coverage_status, exclusions_or_issues, confidence }
- loss_facts: { loss_description, location, mechanism_of_loss, alleged_negligence, known_disputes, confidence }
- injuries: array of { claimant, injury, body_part, severity, treatment_status, causation_notes, confidence }
- damages: { medical_bills, lost_wages, property_damage, demand_amount, reserve_amount, other_damages, confidence }
- timeline: array of { date, event_type, description, source_document, confidence }
- evidence: array of { item, evidence_type, supports, weakens, source_document, confidence }
- liability_factors: array of { factor, impact, explanation, confidence }
- coverage_factors: array of { factor, impact, explanation, confidence }
- venue_factors: array of { factor, impact, explanation, confidence }
- missing_information: array of { item, category, why_it_matters, priority }
- conflicts: array of { conflict, documents_or_sources, impact, needs_follow_up }
- confidence: { overall, liability, coverage, damages, venue, explanation }
`;

export const buildClaimKnowledgeSchema = () => ({
  type: "object",
  properties: {
    claim_identity: { type: "object" },
    parties: { type: "array", items: { type: "object" } },
    policy: { type: "object" },
    loss_facts: { type: "object" },
    injuries: { type: "array", items: { type: "object" } },
    damages: { type: "object" },
    timeline: { type: "array", items: { type: "object" } },
    evidence: { type: "array", items: { type: "object" } },
    liability_factors: { type: "array", items: { type: "object" } },
    coverage_factors: { type: "array", items: { type: "object" } },
    venue_factors: { type: "array", items: { type: "object" } },
    missing_information: { type: "array", items: { type: "object" } },
    conflicts: { type: "array", items: { type: "object" } },
    confidence: { type: "object" },
  },
});

export const buildComparativeVerdictSchema = () => ({
  type: "object",
  properties: {
    exposure_snapshot: { type: "object" },
    why_comparables_matter: { type: "string" },
    similarity_breakdown: { type: "array", items: { type: "object" } },
    top_comparable_cases: { type: "array", items: { type: "object" } },
    valuation_drivers: { type: "object" },
    recommended_considerations: { type: "array", items: { type: "object" } },
    comparison_quality_assessment: { type: "object" },
    defense_perspective: { type: "string" },
    plaintiff_perspective: { type: "string" },
  },
});

export const buildReportSchema = () => ({
  claim_knowledge: buildClaimKnowledgeSchema(),
  executive_summary: { type: "string" },
  coverage_summary: { type: "string" },
  coverage_issues: { type: "string" },
  liability_assessment: { type: "string" },
  damages_summary: { type: "string" },
  medical_timeline: { type: "string" },
  litigation_status: { type: "string" },
  venue_exposure_analysis: { type: "string" },
  exposure_analysis: { type: "string" },
  settlement_evaluation: { type: "string" },
  strengths: { type: "string" },
  weaknesses: { type: "string" },
  red_flags: { type: "string" },
  missing_information: { type: "string" },
  recommended_next_steps: { type: "string" },
  suggested_follow_up_questions: { type: "string" },
  overall_claim_assessment: { type: "string" },
  supervisor_review: { type: "string" },
  confidence_level: { type: "string" },
  venue_risk_level: { type: "string" },
  liability_allocation_summary: { type: "string" },
  comparative_verdict_data: buildComparativeVerdictSchema(),
});
