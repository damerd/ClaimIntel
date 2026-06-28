import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckSquare, Square } from "lucide-react";

export const ALL_SECTIONS = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "coverage_summary", label: "Coverage Analysis" },
  { key: "coverage_issues", label: "Coverage Issues" },
  { key: "liability_assessment", label: "Liability Assessment with Percentages" },
  { key: "damages_summary", label: "Damages Overview" },
  { key: "medical_treatment_summary", label: "Medical Treatment Summary" },
  { key: "litigation_status", label: "Litigation Status" },
  { key: "venue_exposure_analysis", label: "Venue Analysis" },
  { key: "exposure_analysis", label: "Exposure Analysis" },
  { key: "settlement_evaluation", label: "Settlement Evaluation" },
  { key: "strengths_and_weaknesses", label: "Strengths and Weaknesses" },
  { key: "red_flags", label: "Red Flags" },
  { key: "missing_information", label: "Missing Information" },
  { key: "recommended_next_steps", label: "Recommended Next Steps" },
  { key: "suggested_follow_up_questions", label: "Suggested Follow-Up Questions" },
  { key: "overall_claim_assessment", label: "Overall Claim Assessment" },
  { key: "supervisor_review", label: "Supervisor Review" },
];

export const DEFAULT_SECTIONS = ALL_SECTIONS.map((s) => s.key);

export default function SectionSelector({ selected, onChange }) {
  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const allSelected = selected.length === ALL_SECTIONS.length;

  const toggleAll = () => {
    onChange(allSelected ? [] : DEFAULT_SECTIONS);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Review Sections to Include</CardTitle>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-primary hover:underline font-medium"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Choose which sections the AI should generate for this review.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_SECTIONS.map((section) => {
            const isSelected = selected.includes(section.key);
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => toggle(section.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                  isSelected
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Square className="w-4 h-4 shrink-0" />
                )}
                <span className="font-medium text-xs leading-tight">{section.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}