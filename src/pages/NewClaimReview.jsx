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
import { Loader2, FileText, Sparkles, ArrowLeft, Upload } from "lucide-react";
import DisclaimerBanner from "@/components/claims/DisclaimerBanner";
import { SAMPLE_CLAIM } from "@/lib/sampleClaim";
import { toast } from "@/components/ui/use-toast";

const LINES_OF_BUSINESS = [
  "Commercial Auto",
  "Personal Auto",
  "General Liability",
  "Workers Compensation",
  "Property",
  "Professional Liability",
  "Product Liability",
  "Other",
];

const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida",
  "Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine",
  "Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska",
  "Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota",
  "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

export default function NewClaimReview() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    claim_name: "",
    claim_number: "",
    date_of_loss: "",
    jurisdiction: "",
    line_of_business: "",
    claim_file_text: "",
    reviewer_notes: "",
  });

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
    toast({ title: "Sample data loaded", description: "Fictional commercial auto BI claim loaded." });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateField("claim_file_text", ev.target.result);
    reader.readAsText(file);
  };

  const analyzeAndSave = useMutation({
    mutationFn: async () => {
      // Create the claim review first in draft
      const review = await base44.entities.ClaimReview.create({
        ...form,
        status: "analyzing",
      });

      // Call LLM for analysis
      const prompt = `You are a professional insurance claims review assistant. Analyze the following claim file and produce a structured claim review. 

IMPORTANT RULES:
- Only summarize facts found in the claim file text provided below.
- If information is missing, list it under "Missing Information."
- Do NOT create facts or make assumptions.
- Do NOT make legal conclusions.
- Do NOT recommend final settlement authority unless the file provides enough support.
- Clearly separate facts from recommendations.
- Use a professional insurance claims tone.
- Reference "Based on claim file text provided" where appropriate.

CLAIM DETAILS:
Claim Name: ${form.claim_name}
Claim Number: ${form.claim_number}
Date of Loss: ${form.date_of_loss}
Jurisdiction: ${form.jurisdiction}
Line of Business: ${form.line_of_business}
${form.reviewer_notes ? `Reviewer Notes: ${form.reviewer_notes}` : ""}

CLAIM FILE TEXT:
${form.claim_file_text}

Produce a JSON response with these exact keys:
- executive_summary (2-3 paragraph overview)
- coverage_summary (policy details, limits, coverage status)
- liability_summary (fault analysis, evidence, disputed factors)
- damages_summary (total damages claimed with breakdown)
- medical_treatment_summary (treatment timeline and providers)
- litigation_status (current legal status)
- settlement_posture (demand analysis and positioning)
- red_flags (any concerns or inconsistencies)
- missing_information (what's not in the file)
- recommended_next_steps (actionable items)
- confidence_level ("High", "Medium", or "Low")`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            coverage_summary: { type: "string" },
            liability_summary: { type: "string" },
            damages_summary: { type: "string" },
            medical_treatment_summary: { type: "string" },
            litigation_status: { type: "string" },
            settlement_posture: { type: "string" },
            red_flags: { type: "string" },
            missing_information: { type: "string" },
            recommended_next_steps: { type: "string" },
            confidence_level: { type: "string" },
          },
        },
      });

      // Update the review with analysis results
      await base44.entities.ClaimReview.update(review.id, {
        ...result,
        status: "reviewed",
      });

      return review.id;
    },
    onSuccess: (id) => {
      navigate(`/review/${id}`);
    },
    onError: () => {
      toast({ title: "Analysis failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const isValid = form.claim_name && form.claim_number && form.date_of_loss && form.jurisdiction && form.line_of_business && form.claim_file_text;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">New Claim Review</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Enter claim details and file text for AI analysis</p>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Sample Data Button */}
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

      {/* Claim File */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Claim File Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload .txt file</span>
              </div>
            </Label>
            <input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
            <span className="text-xs text-muted-foreground">or paste text below</span>
          </div>
          <Textarea
            value={form.claim_file_text}
            onChange={(e) => updateField("claim_file_text", e.target.value)}
            placeholder="Paste the full claim file text here..."
            className="min-h-[250px] font-mono text-xs leading-relaxed"
          />
          {form.claim_file_text && (
            <p className="text-xs text-muted-foreground">{form.claim_file_text.length.toLocaleString()} characters</p>
          )}
        </CardContent>
      </Card>

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
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Claim...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze & Generate Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}