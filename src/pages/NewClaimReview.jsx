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
import SectionSelector, { DEFAULT_SECTIONS } from "@/components/claims/SectionSelector";
import DocumentUploader from "@/components/claims/DocumentUploader";
import { SAMPLE_CLAIM } from "@/lib/sampleClaim";
import { toast } from "sonner";

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
  coverage_summary: `coverage_summary: Describe policy details, applicable limits, coverage status (confirmed/denied/pending), and any relevant policy conditions based solely on the file.`,
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
  medical_treatment_summary: `medical_treatment_summary: Provide a timeline of medical treatment, list providers, diagnoses, procedures, and any gaps or inconsistencies in treatment. Note if records are missing.`,
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
};

export default function NewClaimReview() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    claim_name: "", claim_number: "", date_of_loss: "",
    jurisdiction: "", line_of_business: "", claim_file_text: "", reviewer_notes: "",
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
    });
    toast.success("Sample data loaded", { description: "Fictional commercial auto BI claim loaded." });
  };

  const analyzeAndSave = useMutation({
    mutationFn: async () => {
      const review = await base44.entities.ClaimReview.create({
        ...form,
        selected_sections: selectedSections,
        status: "analyzing",
      });

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

Return JSON with keys: executive_summary, coverage_summary, coverage_issues, liability_assessment, damages_summary, medical_treatment_summary, litigation_status, venue_exposure_analysis, settlement_evaluation, red_flags, missing_information, recommended_next_steps, supervisor_review, confidence_level, venue_risk_level, liability_allocation_summary`;

      const schemaProps = {
        executive_summary: { type: "string" },
        coverage_summary: { type: "string" },
        coverage_issues: { type: "string" },
        liability_assessment: { type: "string" },
        damages_summary: { type: "string" },
        medical_treatment_summary: { type: "string" },
        litigation_status: { type: "string" },
        venue_exposure_analysis: { type: "string" },
        settlement_evaluation: { type: "string" },
        red_flags: { type: "string" },
        missing_information: { type: "string" },
        recommended_next_steps: { type: "string" },
        supervisor_review: { type: "string" },
        confidence_level: { type: "string" },
        venue_risk_level: { type: "string" },
        liability_allocation_summary: { type: "string" },
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: schemaProps },
      });

      await base44.entities.ClaimReview.update(review.id, {
        ...result,
        status: "reviewed",
      });

      return review.id;
    },
    onSuccess: (id) => navigate(`/review/${id}`),
    onError: () => toast.error("Analysis failed", { description: "ClaimIntel could not complete the analysis. Please try again." }),
  });

  const isValid = form.claim_name && form.claim_number && form.date_of_loss && form.jurisdiction && form.line_of_business && form.claim_file_text && selectedSections.length > 0;

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