import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DisclaimerBanner from "@/components/claims/DisclaimerBanner";
import BetaBanner from "@/components/claims/BetaBanner";
import BetaUsageIndicator, { useBetaUsage } from "@/components/claims/BetaUsageIndicator";
import PremiumLockScreen from "@/components/claims/PremiumLockScreen";
import SectionSelector, { DEFAULT_SECTIONS } from "@/components/claims/SectionSelector";
import DocumentUploader from "@/components/claims/DocumentUploader";
import { validateClaimPackage } from "@/algorithms/claimValidationEngine";
import {
  buildPersistedValidationData,
  buildReadinessRecommendation,
  buildValidationPromptContext,
} from "@/lib/deterministicValidationAdapter";
import {
  buildReportSchema,
  CLAIM_KNOWLEDGE_INSTRUCTIONS,
  LINES_OF_BUSINESS,
  SECTION_PROMPTS,
  STATES,
} from "@/lib/claimAnalysisConfig";
import { SAMPLE_CLAIM } from "@/lib/sampleClaim";
import { logAuditEvent } from "@/lib/auditLogger";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const EMPTY_FORM = {
  claim_name: "",
  claim_number: "",
  date_of_loss: "",
  jurisdiction: "",
  line_of_business: "",
  claim_file_text: "",
  reviewer_notes: "",
  insured_name: "",
  claimant_name: "",
  policy_limits: "",
  current_demand: "",
  reserve_amount: "",
  defense_counsel: "",
};

function ValidationPreview({ result }) {
  if (!result) return null;

  const hasBlockingIssues = result.blockingIssues.length > 0;
  const Icon = hasBlockingIssues ? AlertTriangle : CheckCircle2;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <CardTitle className="text-base">Deterministic Pre-Analysis Validation</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Rule-based validation completed before the AI report is generated.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Readiness</p>
            <p className="text-xl font-bold">{result.readinessScore}/100</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border px-2.5 py-1">{result.overallStatus}</span>
          <span className="rounded-full border px-2.5 py-1">
            {result.statistics.sourceCount} source record(s)
          </span>
          <span className="rounded-full border px-2.5 py-1">
            {result.statistics.uniqueTokenCount} indexed terms
          </span>
          <span className="rounded-full border px-2.5 py-1">
            {result.statistics.issueCount} issue(s)
          </span>
        </div>

        {result.issues.length > 0 ? (
          <div className="space-y-2">
            {result.issues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{issue.explanation}</p>
                    <p className="text-xs text-muted-foreground mt-1">{issue.recommendation}</p>
                  </div>
                  <span className="text-xs font-semibold shrink-0">{issue.severity}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No deterministic conflicts or missing requirements were identified.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function NewClaimReview() {
  const navigate = useNavigate();
  const { exhausted } = useBetaUsage();
  const { showBetaElements } = useUserRole();
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedSections, setSelectedSections] = useState(DEFAULT_SECTIONS);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploaderResetKey, setUploaderResetKey] = useState(0);
  const [validationPreview, setValidationPreview] = useState(null);

  const updateField = (field, value) => {
    setValidationPreview(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleDocumentsChange = (documents) => {
    setValidationPreview(null);
    setUploadedDocuments(documents);
  };

  const loadSample = () => {
    setUploadedDocuments([]);
    setUploaderResetKey((key) => key + 1);
    setValidationPreview(null);
    setForm({
      ...EMPTY_FORM,
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
    toast.success("Sample data loaded", {
      description: "Fictional commercial auto BI claim loaded.",
    });
  };

  const analyzeAndSave = useMutation({
    mutationFn: async (validationResult) => {
      const persistedValidation = buildPersistedValidationData(validationResult);
      const readinessRecommendation = buildReadinessRecommendation(validationResult);
      const readinessCategories = validationResult.categoryResults.map((category) => ({
        category: category.category,
        status: category.status,
        score: category.score,
      }));
      const missingRequirements = validationResult.missingRequirements.map(
        (issue) => issue.explanation,
      );

      logAuditEvent("claim_review_create", {
        relatedClaimId: null,
        metadata: {
          claim_name: form.claim_name,
          claim_number: form.claim_number,
          validation_status: validationResult.overallStatus,
          readiness_score: validationResult.readinessScore,
        },
      });

      const review = await base44.entities.ClaimReview.create({
        ...form,
        selected_sections: selectedSections,
        readiness_score: validationResult.readinessScore,
        readiness_categories: JSON.stringify(readinessCategories),
        missing_requirements: JSON.stringify(missingRequirements),
        readiness_recommendation: readinessRecommendation,
        validation_engine_data: JSON.stringify(persistedValidation),
        status: "analyzing",
      });

      const processedDocuments = uploadedDocuments.filter(
        (document) => document.status === "processed",
      );

      logAuditEvent("document_upload", {
        relatedClaimId: review.id,
        metadata: { document_count: processedDocuments.length },
      });

      const sectionInstructions = selectedSections
        .map((key) => SECTION_PROMPTS[key])
        .filter(Boolean)
        .join("\n\n");

      const documentSummary = processedDocuments
        .map((document) => `- ${document.name} (${document.documentType || document.mimeType})`)
        .join("\n");

      const prompt = `You are ClaimIntel, a professional insurance claims intelligence assistant. Analyze the claim file package and produce a structured claim review plus an internal Shared Claim Knowledge Layer.

IMPORTANT RULES:
- Only use facts found in the claim file text or entered form fields. Do not invent facts.
- Do not provide legal advice or make unsupported jurisdictional assumptions.
- If a selected section cannot be completed, identify the missing information.
- Separate factual findings from recommendations.
- Do not recalculate, replace, or weaken the deterministic validation results below.
- Treat high and critical deterministic issues as unresolved unless the claim file itself resolves them.
- Use professional insurance claims language.

DETERMINISTIC PRE-ANALYSIS VALIDATION:
${buildValidationPromptContext(validationResult)}

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

${processedDocuments.length > 0 ? `DOCUMENTS INCLUDED (${processedDocuments.length}):\n${documentSummary}` : ""}

CLAIM FILE TEXT:
${form.claim_file_text}

GENERATE ONLY THE FOLLOWING REPORT SECTIONS. Leave non-selected report sections as empty strings:
${sectionInstructions}

Also include:
- confidence_level: "High", "Medium", or "Low" based on file completeness
- venue_risk_level: "Low", "Moderate", "High", "Severe", or "Unknown"
- liability_allocation_summary: a single line such as "Insured 60% / Claimant 40%" or "Insufficient information to allocate"
${CLAIM_KNOWLEDGE_INSTRUCTIONS}
Return JSON matching the supplied schema.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: buildReportSchema(),
        },
      });

      await base44.entities.ClaimReview.update(review.id, {
        ...result,
        claim_knowledge: result.claim_knowledge
          ? JSON.stringify(result.claim_knowledge)
          : "",
        readiness_score: validationResult.readinessScore,
        readiness_categories: JSON.stringify(readinessCategories),
        missing_requirements: JSON.stringify(missingRequirements),
        readiness_recommendation: readinessRecommendation,
        comparative_verdict_data: result.comparative_verdict_data
          ? JSON.stringify(result.comparative_verdict_data)
          : "",
        validation_engine_data: JSON.stringify(persistedValidation),
        status: "reviewed",
      });

      logAuditEvent("report_generation", {
        relatedClaimId: review.id,
        metadata: {
          success: true,
          deterministic_validation: true,
          readiness_score: validationResult.readinessScore,
        },
      });

      return review.id;
    },
    onSuccess: (id) => navigate(`/review/${id}`),
    onError: () => toast.error("Analysis failed", {
      description: "ClaimIntel could not complete the analysis. Please try again.",
    }),
  });

  const handleAnalyze = () => {
    const validationResult = validateClaimPackage({
      form,
      documents: uploadedDocuments,
    });
    setValidationPreview(validationResult);

    if (validationResult.blockingIssues.length > 0) {
      const issueList = validationResult.blockingIssues
        .slice(0, 5)
        .map((issue) => `• [${issue.severity}] ${issue.explanation}`)
        .join("\n");

      const proceed = window.confirm(
        `Deterministic validation identified issues that may affect report reliability:\n\n${issueList}\n\nReadiness score: ${validationResult.readinessScore}/100\n\nDo you want to proceed with analysis anyway?`,
      );
      if (!proceed) return;
    }

    analyzeAndSave.mutate(validationResult);
  };

  const isValid = Boolean(
    form.claim_name
      && form.claim_number
      && form.date_of_loss
      && form.jurisdiction
      && form.line_of_business
      && form.claim_file_text
      && selectedSections.length > 0,
  );

  if (exhausted) return <PremiumLockScreen />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
            New Claims Intelligence Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload claim documents and enter details for AI-powered analysis
          </p>
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

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Claim Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Claim Name *</Label>
              <Input value={form.claim_name} onChange={(event) => updateField("claim_name", event.target.value)} placeholder="e.g. Smith v. ABC Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Claim Number *</Label>
              <Input value={form.claim_number} onChange={(event) => updateField("claim_number", event.target.value)} placeholder="e.g. CA-2024-00001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date of Loss *</Label>
              <Input type="date" value={form.date_of_loss} onChange={(event) => updateField("date_of_loss", event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Jurisdiction *</Label>
              <Select value={form.jurisdiction} onValueChange={(value) => updateField("jurisdiction", value)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Line of Business *</Label>
              <Select value={form.line_of_business} onValueChange={(value) => updateField("line_of_business", value)}>
                <SelectTrigger><SelectValue placeholder="Select line of business" /></SelectTrigger>
                <SelectContent>
                  {LINES_OF_BUSINESS.map((line) => <SelectItem key={line} value={line}>{line}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Claim Overview Details</CardTitle>
          <p className="text-xs text-muted-foreground">
            Additional information for the report overview table (optional)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Insured Name</Label>
              <Input value={form.insured_name} onChange={(event) => updateField("insured_name", event.target.value)} placeholder="e.g. ABC Trucking Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Claimant Name</Label>
              <Input value={form.claimant_name} onChange={(event) => updateField("claimant_name", event.target.value)} placeholder="e.g. John Smith" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Policy Limits</Label>
              <Input value={form.policy_limits} onChange={(event) => updateField("policy_limits", event.target.value)} placeholder="e.g. $1,000,000 CSL" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Current Demand</Label>
              <Input value={form.current_demand} onChange={(event) => updateField("current_demand", event.target.value)} placeholder="e.g. $850,000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reserve Amount</Label>
              <Input value={form.reserve_amount} onChange={(event) => updateField("reserve_amount", event.target.value)} placeholder="e.g. $500,000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Defense Counsel</Label>
              <Input value={form.defense_counsel} onChange={(event) => updateField("defense_counsel", event.target.value)} placeholder="e.g. Smith & Associates LLP" />
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentUploader
        key={uploaderResetKey}
        onTextChange={(text) => updateField("claim_file_text", text)}
        onDocumentsChange={handleDocumentsChange}
      />

      <ValidationPreview result={validationPreview} />

      <SectionSelector selected={selectedSections} onChange={setSelectedSections} />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Reviewer Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.reviewer_notes}
            onChange={(event) => updateField("reviewer_notes", event.target.value)}
            placeholder="Add any context or specific areas to focus on..."
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
        <Button
          onClick={handleAnalyze}
          disabled={!isValid || analyzeAndSave.isPending}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[180px]"
        >
          {analyzeAndSave.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Claim...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Validate and Generate Report</>
          )}
        </Button>
      </div>
    </div>
  );
}
