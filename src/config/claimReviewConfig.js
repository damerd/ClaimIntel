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
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

export const SECTION_PROMPTS = {
  executive_summary: `executive_summary: A 2-3 paragraph high-level overview of the claim including parties, loss event, current status, and key exposures.`,
  coverage_summary: `coverage_summary: Summarize applicable coverage including policy type, limits, covered perils, and coverage status. Identify any exclusions, potential coverage defenses, reservation of rights concerns, and outstanding coverage questions. If policy information is not in the file, state what coverage information is missing.`,
  coverage_issues: `coverage_issues: Identify any coverage gaps, exclusions, reservation of rights concerns, or policy interpretation issues. If none are apparent, state that clearly.`,
  liability_assessment: `liability_assessment: Provide a preliminary liability allocation using this exact format:
---
PRELIMINARY LIABILITY ALLOCATION (based on claim file text only)

Insured: ___%
Claimant: ___%
Other/Unknown: ___%

Basis:
- [List facts from the file supporting this allocation]
- [Identify facts that strengthen or weaken the insured's defense]

If there is insufficient information to allocate liability, state: "Preliminary liability allocation cannot be determined from the current file. The following information is needed: [list]"

Rules: Do not total over 100%. Do not invent facts. Use "preliminary" language throughout.`,
  damages_summary: `damages_summary: Summarize total damages claimed including specials (medical bills, lost wages, property damage) and generals (pain and suffering). Break down each category with amounts if available.`,
  medical_timeline: `medical_timeline: Organize all medical treatment chronologically. For each treatment entry include: date, provider/facility, treatment rendered, and diagnosis. Note any gaps in treatment, inconsistencies, or missing records. If no medical information is in the file, state: "No medical records were identified in the claim file."`,
  litigation_status: `litigation_status: Describe current legal status. Is suit filed? Who is counsel? What court/venue? Are there any upcoming deadlines or motions? If not in litigation, state that.`,
  venue_exposure_analysis: `venue_exposure_analysis: Evaluate venue/jurisdiction exposure using this exact format:
---
VENUE EXPOSURE ANALYSIS

Jurisdiction/Venue: [from claim file]
Venue Risk Level: [Low / Moderate / High / Severe / Unknown]

Relevant Factors:
- Plaintiff-friendly or defense-friendly tendencies (only if supported by file text)
- Jury verdict risk
- Litigation cost risk
- Local procedural concerns
- Known reputational or trucking/commercial auto risk factors
- Whether venue may increase settlement pressure

Impact on Claim:
- Explain how venue may affect settlement value, litigation strategy, or trial risk.

If the claim file does not provide enough venue information, state: "Venue exposure cannot be fully assessed from the current file." Do not cite real case law unless it is in the claim file.`,
  settlement_evaluation: `settlement_evaluation: Evaluate settlement posture using this format:
---
SETTLEMENT EVALUATION

Current Demand: [amount or "not stated"]
Specials / Documented Damages: [itemized if available]

Strengths Supporting Settlement:
- [list]

Weaknesses Reducing Value:
- [list]

Suggested Negotiation Range: [only if supported by the file — otherwise state "Insufficient information to recommend a negotiation range at this time. The following is needed: [list]"]

Note: Do not recommend a specific authority figure unless the file fully supports it.`,
  red_flags: `red_flags: List any concerns, inconsistencies, fraud indicators, coverage issues, or litigation risks that warrant attention. If none, state that explicitly.`,
  missing_information: `missing_information: List all information that is absent from the claim file that would be needed for a complete review. Be specific about what is missing and why it matters.`,
  recommended_next_steps: `recommended_next_steps: Provide a numbered list of actionable next steps for the adjuster, clearly labeled as recommendations. Separate factual findings from recommendations.`,
  supervisor_review: `supervisor_review: Provide a concise manager-level summary using this exact format:
---
SUPERVISOR REVIEW

Coverage: [Clear / Issues Present / Unknown]

Liability: [Preliminary allocation and brief 1-2 sentence explanation]

Damages: [Low / Moderate / High / Severe / Unknown]

Venue: [Low / Moderate / High / Severe / Unknown]

Settlement: [Current demand and recommended negotiation position if supported — otherwise "Insufficient information"]

Recommended Action:
- [Choose from: Approve continued negotiation / Request additional records / Obtain defense counsel evaluation / Schedule roundtable / Consider mediation / Increase reserves / Maintain current position / Other file-specific recommendation]

Authority Consideration: [State whether authority can be reasonably evaluated from the file. If not, identify what information is needed.]`,
  exposure_analysis: `exposure_analysis: Provide a comprehensive exposure analysis using this format:
---
EXPOSURE ANALYSIS

Policy Limits: [state limits if known]
Demand: [amount or "not stated"]

Exposure Categories:
- Bodily Injury Exposure: [Low / Moderate / High / Severe / Unknown — with brief explanation]
- Property Damage Exposure: [Low / Moderate / High / Severe / Unknown — with brief explanation]
- Excess/Bad Faith Exposure: [Low / Moderate / High / Severe / Unknown — with brief explanation]

Worst-Case Scenario:
- [Describe the maximum realistic exposure based on file facts only]

Mitigating Factors:
- [List facts that reduce exposure]

Aggravating Factors:
- [List facts that increase exposure]

Overall Exposure Rating: [Low / Moderate / High / Severe / Unknown]

If insufficient information exists, state: "Exposure cannot be fully assessed from the current file."`,
  strengths: `strengths: List the key strengths supporting the defense/insured position. Use bullet points. Only include facts found in the claim file. If none are apparent, state that clearly.`,
  weaknesses: `weaknesses: List the key weaknesses undermining the defense/insured position. Use bullet points. Only include facts found in the claim file. If none are apparent, state that clearly.`,
  suggested_follow_up_questions: `suggested_follow_up_questions: Provide a numbered list of questions the adjuster should consider or investigate further, using this format:
---
SUGGESTED FOLLOW-UP QUESTIONS

Based on the claim file, the following questions warrant further investigation:

1. [Question about liability, facts, or disputed issues]
2. [Question about coverage or policy interpretation]
3. [Question about damages or medical treatment]
4. [Question about evidence or documentation gaps]
5. [Question about strategy or next steps]
[Add more as relevant]

Note: These are investigative questions based on the claim file, not legal advice.`,
  overall_claim_assessment: `overall_claim_assessment: Provide a holistic summary using this format:
---
OVERALL CLAIM ASSESSMENT

Claim Severity: [Low / Moderate / High / Severe]

Complexity Level: [Low / Moderate / High]

Key Takeaways:
- [2-4 bullet points summarizing the most important findings]

Primary Risks:
- [List the most significant risks identified]

Primary Opportunities:
- [List any opportunities for favorable resolution]

Recommended Handling:
- [Brief recommendation on overall handling approach]

Reserve Consideration:
- [Brief note on whether reserves should be reviewed based on file facts]

Summary Statement: [2-3 sentences providing an overall professional assessment of the claim based solely on the file]`,
};


export const CLAIM_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: { type: "string" }, coverage_summary: { type: "string" }, coverage_issues: { type: "string" },
    liability_assessment: { type: "string" }, damages_summary: { type: "string" }, medical_timeline: { type: "string" },
    litigation_status: { type: "string" }, venue_exposure_analysis: { type: "string" }, exposure_analysis: { type: "string" },
    settlement_evaluation: { type: "string" }, strengths: { type: "string" }, weaknesses: { type: "string" },
    red_flags: { type: "string" }, missing_information: { type: "string" }, recommended_next_steps: { type: "string" },
    suggested_follow_up_questions: { type: "string" }, overall_claim_assessment: { type: "string" }, supervisor_review: { type: "string" },
    venue_risk_level: { type: "string" }, liability_allocation_summary: { type: "string" }, readiness_score: { type: "number" },
    readiness_categories: { type: "array", items: { type: "object", properties: { category: { type: "string" }, status: { type: "string" } } } },
    missing_requirements: { type: "array", items: { type: "string" } }, readiness_recommendation: { type: "string" },
  },
};
