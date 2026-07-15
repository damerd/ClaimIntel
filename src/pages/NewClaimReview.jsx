import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { LINES_OF_BUSINESS, STATES } from "@/config/claimReviewConfig";
import { submitClaimReview } from "@/services/claimReviewService";
import { validateClaimReview } from "@/lib/claimValidation";
import { normalizeError } from "@/lib/appError";
import ClaimValidationSummary from "@/components/claims/ClaimValidationSummary";


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

  const validation = validateClaimReview({ form, selectedSections, documents: uploadedDocuments });

  const analyzeAndSave = useMutation({
    mutationFn: () => submitClaimReview({ form, selectedSections, documents: uploadedDocuments }),
    onSuccess: (id) => navigate(`/review/${id}`),
    onError: (error) => {
      const normalized = normalizeError(error, "ClaimIntel could not complete the analysis. Please try again.");
      toast.error("Analysis failed", { description: normalized.userMessage });
    },
  });

  const isValid = validation.isValid;

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

      <ClaimValidationSummary validation={validation} />

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