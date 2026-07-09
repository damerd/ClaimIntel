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

const VALIDATION_ENGINE_INSTRUCTIONS = `
Also always create validation_engine_data: a structured JSON object representing the Validation Engine results. The Validation Engine validates the Shared Claim Knowledge Layer before downstream intelligence modules use it. It must be completely fact-based.

VALIDATION RULES:
- Only identify conflicts supported by uploaded documents, OCR text, user-entered claim information, or claim_knowledge. Never invent facts.
- If information is missing, identify it as missing rather than making assumptions.
- Detect inconsistencies involving: parties, dates, policy limits, injuries, damages, reserve amounts, demands, venue, litigation status, and coverage information.

Return the following structure:
- overall_validation_status: "Clear", "Needs Review", "High Risk", or "Insufficient Information"
- validation_score: number 0-100
- conflicts: array of { issue, category, source_detail, impact, priority, recommended_follow_up }
- missing_evidence: array of { item, category, why_it_matters, priority }
- confidence_factors: array of { area, confidence, explanation }
- priority_flags: array of { flag, severity, explanation }
- recommended_validation_actions: array of recommended investigative action strings
- validation_summary: concise professional summary explaining why the validation score was assigned
`;

const CLAIM_KNOWLEDGE_INSTRUCTIONS = `
Also always create claim_knowledge: a structured JSON object representing the internal Shared Claim Knowledge Layer. It must be based only on claim file text and entered form fields. Use empty strings, empty arrays, or "Unknown" when facts are unavailable. Include:
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

const buildClaimKnowledgeSchema = () => ({
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

const buildValidationEngineSchema = () => ({
  type: "object",
  properties: {
    overall_validation_status: { type: "string" },
    validation_score: { type: "number" },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          issue: { type: "string" },
          category: { type: "string" },
          source_detail: { type: "string" },
          impact: { type: "string" },
          priority: { type: "string" },
          recommended_follow_up: { type: "string" },
        },
      },
    },
    missing_evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          category: { type: "string" },
          why_it_matters: { type: "string" },
          priority: { type: "string" },
        },
      },
    },
    confidence_factors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          confidence: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
    priority_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          flag: { type: "string" },
          severity: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
    recommended_validation_actions: { type: "array", items: { type: "string" } },
    validation_summary: { type: "string" },
  },
});

const buildComparativeVerdictSchema = () => ({
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
      logAuditEvent("claim_review_create", {
        relatedClaimId: null,
        metadata: { claim_name: form.claim_name, claim_number: form.claim_number },
      });

      const review = await base44.entities.ClaimReview.create({
        ...form,
        selected_sections: selectedSections,
        status: "analyzing",
      });

      const processedDocuments = uploadedDocuments.filter((d) => d.status === "processed");
      logAuditEvent("document_upload", {
        relatedClaimId: review.id,
        metadata: { document_count: processedDocuments.length },
      });

      const sectionInstructions = selectedSections
        .map((key) => SECTION_PROMPTS[key])
        .filter(Boolean)
        .join("\n\n");

      const docSummaryLines = processedDocuments
        .map((d) => `- ${d.name} (${d.documentType || d.mimeType})`)
        .join("\n");

      const prompt = `You are ClaimIntel, a professional insurance claims intelligence assistant. Analyze the claim file package and produce a structured claim review plus an internal Shared Claim Knowledge Layer.

IMPORTANT RULES:
- Only use facts found in the claim file text or entered form fields. Do NOT invent facts.
- Do NOT provide legal advice or make unsupported jurisdictional assumptions.
- If a selected section cannot be completed due to missing information, include the section and state what is missing.
- Separate factual findings from recommendations.
- Use professional insurance claims language.
- Use information from all uploaded documents. Do not duplicate facts repeated across documents.
- Flag conflicts between documents.
- Identify missing records normally expected in a claim file of this type.

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

${processedDocuments.length > 0 ? `DOCUMENTS INCLUDED (${processedDocuments.length}):\n${docSummaryLines}` : ""}

CLAIM FILE TEXT:
${form.claim_file_text}

GENERATE ONLY THE FOLLOWING REPORT SECTIONS. Leave non-selected report sections as empty strings:
${sectionInstructions}

Also always include:
- confidence_level: "High", "Medium", or "Low" based on file completeness
- venue_risk_level: "Low", "Moderate", "High", "Severe", or "Unknown"
- liability_allocation_summary: a single line like "Insured 60% / Claimant 40%" or "Insufficient information to allocate"
- readiness_score: number 0-100 based on completeness of documentation, investigation, and required information
- readiness_categories: array of {category, status} for Liability, Coverage, Investigation, Medical Documentation, Damages Documentation
- missing_requirements: array of specific outstanding investigation items
- readiness_recommendation: concise recommendation summarizing highest-priority missing items and impact
${VALIDATION_ENGINE_INSTRUCTIONS}
${CLAIM_KNOWLEDGE_INSTRUCTIONS}
Return JSON with keys: claim_knowledge, executive_summary, coverage_summary, coverage_issues, liability_assessment, damages_summary, medical_timeline, litigation_status, venue_exposure_analysis, exposure_analysis, settlement_evaluation, strengths, weaknesses, red_flags, missing_information, recommended_next_steps, suggested_follow_up_questions, overall_claim_assessment, supervisor_review, confidence_level, venue_risk_level, liability_allocation_summary, readiness_score, readiness_categories, missing_requirements, readiness_recommendation, comparative_verdict_data, validation_engine_data`;

      const schemaProps = {
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
        readiness_score: { type: "number" },
        readiness_categories: { type: "array", items: { type: "object" } },
        missing_requirements: { type: "array", items: { type: "string" } },
        readiness_recommendation: { type: "string" },
        comparative_verdict_data: buildComparativeVerdictSchema(),
        validation_engine_data: buildValidationEngineSchema(),
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: schemaProps },
      });

      await base44.entities.ClaimReview.update(review.id, {
        ...result,
        claim_knowledge: result.claim_knowledge ? JSON.stringify(result.claim_knowledge) : "",
        readiness_categories: JSON.stringify(result.readiness_categories || []),
        missing_requirements: JSON.stringify(result.missing_requirements || []),
        comparative_verdict_data: result.comparative_verdict_data ? JSON.stringify(result.comparative_verdict_data) : "",
        validation_engine_data: result.validation_engine_data ? JSON.stringify(result.validation_engine_data) : "",
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
      {showBetaElements && <div className="flex justify-center"><BetaUsageIndicator /></div>}
      <DisclaimerBanner />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadSample} className="text-xs">
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Load Sample Claim
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Claim Information</CardTitle></CardHeader>
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
                <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Line of Business *</Label>
              <Select value={form.line_of_business} onValueChange={(v) => updateField("line_of_business", v)}>
                <SelectTrigger><SelectValue placeholder="Select line of business" /></SelectTrigger>
                <SelectContent>{LINES_OF_BUSINESS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <DocumentUploader onTextChange={(text) => updateField("claim_file_text", text)} onDocumentsChange={setUploadedDocuments} />
      <SectionSelector selected={selectedSections} onChange={setSelectedSections} />

      <Card className="shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Reviewer Notes (Optional)</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={form.reviewer_notes} onChange={(e) => updateField("reviewer_notes", e.target.value)} placeholder="Add any context or specific areas to focus on..." className="min-h-[80px] text-sm" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
        <Button onClick={() => analyzeAndSave.mutate()} disabled={!isValid || analyzeAndSave.isPending} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[180px]">
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