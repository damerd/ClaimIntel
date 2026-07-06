import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Scale, HeartPulse, Pill, Gavel, Check, X } from "lucide-react";

function SimilarityBadge({ score }) {
  if (score == null) return null;
  const num = typeof score === "number" ? score : parseInt(score, 10);
  const color = num >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : num >= 50 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${color}`}>
      {num}% Match
    </Badge>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="text-xs">
        <span className="font-medium text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value}</span>
      </div>
    </div>
  );
}

export default function ComparableCaseCard({ caseData, index }) {
  if (!caseData) return null;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comparable Case {index + 1}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {caseData.jurisdiction && (
                <span className="text-sm font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {caseData.jurisdiction}
                </span>
              )}
              {caseData.case_type && (
                <Badge variant="secondary" className="text-xs">{caseData.case_type}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <SimilarityBadge score={caseData.similarity_score} />
            {caseData.verdict_or_settlement && (
              <Badge variant="outline" className="text-xs font-bold bg-primary/5 border-primary/20">
                {caseData.verdict_or_settlement}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-1 border-t border-border">
          <DetailRow icon={HeartPulse} label="Key Injuries" value={caseData.key_injuries} />
          <DetailRow icon={Pill} label="Treatment" value={caseData.treatment} />
          <DetailRow icon={Gavel} label="Liability Facts" value={caseData.liability_facts} />
        </div>

        {(caseData.key_similarities || caseData.key_differences) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            {caseData.key_similarities && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Key Similarities
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{caseData.key_similarities}</p>
              </div>
            )}
            {caseData.key_differences && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Key Differences
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{caseData.key_differences}</p>
              </div>
            )}
          </div>
        )}

        {caseData.why_this_case_matters && (
          <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
            <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-0.5">
              <Scale className="w-3 h-3" /> Why This Case Matters
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{caseData.why_this_case_matters}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}