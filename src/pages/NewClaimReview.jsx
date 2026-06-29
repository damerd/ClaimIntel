import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Sparkles, ArrowLeft } from "lucide-react";
import DisclaimerBanner from "@/components/claims/DisclaimerBanner";
import BetaBanner from "@/components/claims/BetaBanner";
import BetaUsageIndicator, { useBetaUsage } from "@/components/claims/BetaUsageIndicator";
import PremiumLockScreen from "@/components/claims/PremiumLockScreen";
import SectionSelector, { DEFAULT_SECTIONS } from "@/components/claims/SectionSelector";
import DocumentUploader from "@/components/claims/DocumentUploader";
import { SAMPLE_CLAIM } from "@/lib/sampleClaim";
import { logAuditEvent } from "@/lib/auditLogger";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const LINES_OF_BUSINESS = [
  "Commercial Auto", "Personal Auto", "General Liability", "Workers Compensation",
  "Property", "Professional Liability", "Product Liability", "Other",
];

const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida",
  "Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine",
  "Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska",
  "Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota",
  "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const SECTION_PROMPTS = {
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

export default function NewClaimReview() {
  const navigate = useNavigate();
  const { exhausted } = useBetaUsage();
  const { showBetaElements } = useUserRole();
  const [form, setForm] = useState({
    claim_name: "", claim_number: "", date_of_loss: "",
    jurisdiction: "", line_of_business: "", claim_file_text: "", reviewer_notes: "",
    insured_name: "", claimant_name: "", policy_limits: "",
    current_demand: "", reserve_amount: "", defense_counsel: "",
  });
  const [selectedSections, setSelectedSections] = useState(DEFAULT_SECTIONS);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const loadSample = () => {
    setForm({
      claim_name: SAMPLE_CLAIM.claim_name,
      claim_number: SAMPLE_CLAIM.claim_number,
      date_of_loss: SAMPLE_CLAIM.date_of_loss,
      jurisdiction: SAMPLE_CLAIM.jurisdiction,
      line_of_business: SAMPLE_CLAIM.line_of_business,
      claim_file_text: SAMPLE_CLAIM.claim_file_text,
      reviewer_notes: SAMPLE_CLAIM.reviewer_notes,
      insured_name: SAMPLE_CLAIM.insured_name || "",
      claimant_name: SAMPLE_CLAIM.claimant_name || "",
      policy_limits: SAMPLE_CLAIM.policy_limits || "",
      current_demand: SAMPLE_CLAIM.current_demand || "",
      reserve_amount: SAMPLE_CLAIM.reserve_amount || "",
      defense_counsel: SAMPLE_CLAIM.defense_counsel || "",
    });
    toast.success("Sample data loaded", { description: "Fictional commercial auto BI claim loaded." });
  };

  const analyzeAndSave = useMutation({
    mutationFn: async () => {
      logAuditEvent("claim_review_create", { relatedClaimId: null, metadata: { claim_name: form.claim_name, claim_number: form.claim_number } });

      const review = await base44.entities.ClaimReview.create({
        ...form,
        selected_sections: selectedSections,
        status: "analyzing",
      });

      logAuditEvent("document_upload", { relatedClaimId: review.id, metadata: { document_count: uploadedDocuments.filter((d) => d.status === "processed").length } });

      const sectionInstructions = selectedSections
        .map((key) => SECTION_PROMPTS[key])
        .filter(Boolean)
        .join("\n\n");

      const docCount = uploadedDocuments.filter((d) => d.status === "processed").length;
      const docSummaryLines = uploadedDocuments
        .filter((d) => d.status === "processed")
        .map((d) => `- ${d.name} (${d.documentType || d.mimeType})`)
        .join("\n");

      const prompt = `You are a professional insurance claims review assistant. Analyze the following claim file package and produce a structured claim review.

IMPORTANT RULES:
- Only use facts found in the claim file text provided below. Do NOT invent facts.
- Do NOT provide legal advice or make unsupported jurisdictional assumptions.
- If a selected section cannot be completed due to missing information, include the section and clearly state what is missing.
- Clearly separate factual findings from recommendations.
- Use professional insurance claims language throughout.
- Reference "Based on claim file text provided" where appropriate.
- Preserve all formatting instructions in section prompts exactly.
- Use information from ALL uploaded documents. Do NOT duplicate information found in multiple documents.
- Flag any conflicting information between documents.
- Identify missing records that would normally be expected in a claim file of this type.

CLAIM DETAILS:
Claim Name: ${form.claim_name}
Claim Number: ${form.claim_number}
Date of Loss: ${form.date_of_loss}
Jurisdiction: ${form.jurisdiction}
Line of Business: ${form.line_of_business}
${form.insured_name ? `Insured: ${form.insured_name}` : ""}
${form.claimant_name ? `Claimant: ${form.claimant_name}` : ""}
${form.policy_limits ? `Policy Limits: ${form.policy_limits}` : ""}
${form.current_demand ? `Current Demand: ${form.current_demand}` : ""}
${form.reserve_amount ? `Reserve Amount: ${form.reserve_amount}` : ""}
${form.defense_counsel ? `Defense Counsel: ${form.defense_counsel}` : ""}
${form.reviewer_notes ? `Reviewer Notes: ${form.reviewer_notes}` : ""}

${docCount > 0 ? `DOCUMENTS INCLUDED IN THIS PACKAGE (${docCount} document${docCount > 1 ? "s" : ""}):\n${docSummaryLines}` : ""}

CLAIM FILE TEXT:
${form.claim_file_text}

GENERATE ONLY THE FOLLOWING SECTIONS (leave others as empty string ""):
${sectionInstructions}

Also always include:
- confidence_level: "High", "Medium", or "Low" based on completeness of the claim file
- venue_risk_level: "Low", "Moderate", "High", "Severe", or "Unknown" — extract from venue analysis or infer from jurisdiction if possible
- liability_allocation_summary: A single line like "Insured 60% / Claimant 40%" or "Insufficient information to allocate" based on liability assessment
- readiness_score: A number 0-100 representing overall claim readiness for evaluation based on completeness of documentation, investigation, and required information
- readiness_categories: An array of objects with {category, status} for each of: "Liability", "Coverage", "Investigation", "Medical Documentation", "Damages Documentation". Status must be one of: "Complete", "In Progress", "Needs Records", "Partial", "Not Started"
- missing_requirements: An array of strings listing specific outstanding investigation items needed (e.g., "Obtain Recorded Statement", "Obtain Updated Medical Records", "Obtain Wage Documentation")
- readiness_recommendation: A concise recommendation summarizing the highest-priority missing items and their potential impact on liability, exposure, and settlement evaluation

Return JSON with keys: executive_summary, coverage_summary, coverage_issues, liability_assessment, damages_summary, medical_timeline, litigation_status, venue_exposure_analysis, exposure_analysis, settlement_evaluation, strengths, weaknesses, red_flags, missing_information, recommended_next_steps, suggested_follow_up_questions, overall_claim_assessment, supervisor_review, confidence_level, venue_risk_level, liability_allocation_summary, readiness_score, readiness_categories, missing_requirements, readiness_recommendation`;

      const schemaProps = {
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
        readiness_score: { type: "number" },
        readiness_categories: { type: "array", items: { type: "object", properties: { category: { type: "string" }, status: { type: "string" } } } },
        missing_requirements: { type: "array", items: { type: "string" } },
        readiness_recommendation: { type: "string" },
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: schemaProps },
      });

      await base44.entities.ClaimReview.update(review.id, {
        ...result,
        readiness_categories: JSON.stringify(result.readiness_categories || []),
        missing_requirements: JSON.stringify(result.missing_requirements || []),
        status: "reviewed",
      });

      logAuditEvent("report_generation", { relatedClaimId: review.id, metadata: { success: true } });

      return review.id;
    },
    onSuccess: (id) => navigate(`/review/${id}`),
    onError: () => toast.error("Analysis failed", { description: "ClaimIntel could not complete the analysis. Please try again." }),
  });

  const isValid = form.claim_name && form.claim_number && form.date_of_loss && form.jurisdiction && form.line_of_business && form.claim_file_text && selectedSections.length > 0;

  if (exhausted) {
    return <PremiumLockScreen />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">New Claims Intelligence Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload claim documents and enter details for AI-powered analysis</p>
        </div>
      </div>

      {showBetaElements && <BetaBanner />}

      {showBetaElements && (
        <div className="flex justify-center">
          <BetaUsageIndicator />
        </div>
      )}

      <DisclaimerBanner />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadSample} className="text-xs">
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Load Sample Claim
        </Button>
      </div>

      {/* Claim Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Claim Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Claim Name *</Label>
              <Input value={form.claim_name} onChange={(e) => updateField("claim_name", e.target.value)} placeholder="e.g. Smith v. ABC Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Claim Number *</Label>
              <Input value={form.claim_number} onChange={(e) => updateField("claim_number", e.target.value)} placeholder="e.g. CA-2024-00001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date of Loss *</Label>
              <Input type="date" value={form.date_of_loss} onChange={(e) => updateField("date_of_loss", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Jurisdiction *</Label>
              <Select value={form.jurisdiction} onValueChange={(v) => updateField("jurisdiction", v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Line of Business *</Label>
              <Select value={form.line_of_business} onValueChange={(v) => updateField("line_of_business", v)}>
                <SelectTrigger><SelectValue placeholder="Select line of business" /></SelectTrigger>
                <SelectContent>
                  {LINES_OF_BUSINESS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claim Overview Details */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Claim Overview Details</CardTitle>
          <p className="text-xs text-muted-foreground">Additional information for the report overview table (optional)</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Insured Name</Label>
              <Input value={form.insured_name} onChange={(e) => updateField("insured_name", e.target.value)} placeholder="e.g. ABC Trucking Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Claimant Name</Label>
              <Input value={form.claimant_name} onChange={(e) => updateField("claimant_name", e.target.value)} placeholder="e.g. John Smith" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Policy Limits</Label>
              <Input value={form.policy_limits} onChange={(e) => updateField("policy_limits", e.target.value)} placeholder="e.g. $1,000,000 CSL" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Current Demand</Label>
              <Input value={form.current_demand} onChange={(e) => updateField("current_demand", e.target.value)} placeholder="e.g. $850,000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reserve Amount</Label>
              <Input value={form.reserve_amount} onChange={(e) => updateField("reserve_amount", e.target.value)} placeholder="e.g. $500,000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Defense Counsel</Label>
              <Input value={form.defense_counsel} onChange={(e) => updateField("defense_counsel", e.target.value)} placeholder="e.g. Smith & Associates LLP" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Uploader */}
      <DocumentUploader
        onTextChange={(text) => updateField("claim_file_text", text)}
        onDocumentsChange={setUploadedDocuments}
      />

      {/* Section Selector */}
      <SectionSelector selected={selectedSections} onChange={setSelectedSections} />

      {/* Reviewer Notes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Reviewer Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.reviewer_notes}
            onChange={(e) => updateField("reviewer_notes", e.target.value)}
            placeholder="Add any context or specific areas to focus on..."
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
        <Button
          onClick={() => analyzeAndSave.mutate()}
          disabled={!isValid || analyzeAndSave.isPending}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[180px]"
        >
          {analyzeAndSave.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Claim...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generate Intelligence Report</>
          )}
        </Button>
      </div>
    </div>
  );
}