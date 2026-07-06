import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Info, GitCompareArrows, Landmark, TrendingUp,
  TrendingDown, ClipboardCheck, ShieldCheck, ShieldAlert,
  Scale, AlertCircle, Gavel, Users,
} from "lucide-react";
import ComparableCaseCard from "@/components/claims/ComparableCaseCard";

function SubSectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{children}</h4>
    </div>
  );
}

function SnapshotCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value || "Not available"}</p>
    </div>
  );
}

function SimilarityBar({ item }) {
  const level = item.level || "";
  let pct = 0;
  const match = level.match(/(\d+)/);
  if (match) pct = Math.min(100, parseInt(match[1], 10));
  else if (/high/i.test(level)) pct = 80;
  else if (/moderate/i.test(level)) pct = 55;
  else if (/low/i.test(level)) pct = 30;

  const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-slate-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{item.category}</span>
        <span className="text-xs font-bold text-muted-foreground">{item.level}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {item.explanation && (
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">Why this matters: {item.explanation}</p>
      )}
    </div>
  );
}

function DriverItem({ driver, upward }) {
  const rating = (driver.rating || "").toLowerCase();
  const weight = /high/i.test(rating) ? "High"
    : /mod/i.test(rating) ? "Moderate"
    : /low/i.test(rating) ? "Low"
    : driver.rating || "—";

  const weightColor = /high/i.test(weight) ? (upward ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200")
    : /mod/i.test(weight) ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
      {upward
        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        : <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold">{driver.factor}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${weightColor}`}>{weight}</Badge>
        </div>
        {driver.explanation && (
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{driver.explanation}</p>
        )}
      </div>
    </div>
  );
}

const QUALITY_STYLES = {
  High: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Limited: "bg-orange-50 text-orange-700 border-orange-200",
  Insufficient: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ComparativeVerdictIntelligence({ data }) {
  const [perspective, setPerspective] = useState("balanced");

  if (!data) return null;

  const snap = data.exposure_snapshot || {};
  const sims = Array.isArray(data.similarity_breakdown) ? data.similarity_breakdown : [];
  const cases = Array.isArray(data.top_comparable_cases) ? data.top_comparable_cases : [];
  const drivers = data.valuation_drivers || {};
  const upward = Array.isArray(drivers.upward) ? drivers.upward : [];
  const downward = Array.isArray(drivers.downward) ? drivers.downward : [];
  const considerations = Array.isArray(data.recommended_considerations) ? data.recommended_considerations : [];
  const quality = data.comparison_quality_assessment || {};
  const qualityStyle = QUALITY_STYLES[quality.rating] || QUALITY_STYLES.Insufficient;

  const showDefense = perspective === "defense" || perspective === "balanced";
  const showPlaintiff = perspective === "plaintiff" || perspective === "balanced";

  return (
    <Card className="shadow-sm border-slate-300">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Comparative Verdict Intelligence</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Decision support — final evaluation remains with the adjuster</p>
            </div>
          </div>
          {/* Perspective Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <Button
              size="sm"
              variant={perspective === "defense" ? "default" : "ghost"}
              className={`h-7 text-xs ${perspective === "defense" ? "bg-blue-600 hover:bg-blue-600" : ""}`}
              onClick={() => setPerspective(perspective === "defense" ? "balanced" : "defense")}
            >
              <ShieldAlert className="w-3 h-3 mr-1" /> Defense
            </Button>
            <Button
              size="sm"
              variant={perspective === "plaintiff" ? "default" : "ghost"}
              className={`h-7 text-xs ${perspective === "plaintiff" ? "bg-rose-600 hover:bg-rose-600" : ""}`}
              onClick={() => setPerspective(perspective === "plaintiff" ? "balanced" : "plaintiff")}
            >
              <Users className="w-3 h-3 mr-1" /> Plaintiff
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Guardrail Banner */}
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Decision Support Only.</span> ClaimIntel augments professional judgment and does not replace the adjuster.
            This analysis does not constitute legal advice, final settlement instructions, or binding claim recommendations.
            Unsupported conclusions are labeled as speculative. The final investigation, evaluation, reserve decision, and claim outcome remain with the adjuster.
          </p>
        </div>

        {/* 1. Exposure Snapshot */}
        <div>
          <SubSectionTitle icon={BarChart3}>Exposure Snapshot</SubSectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <SnapshotCard label="Expected Verdict Range" value={snap.expected_verdict_range} highlight />
            <SnapshotCard label="Expected Settlement Range" value={snap.expected_settlement_range} highlight />
            <SnapshotCard label="Median Comparable Verdict" value={snap.median_comparable_verdict} />
            <SnapshotCard label="Median Comparable Settlement" value={snap.median_comparable_settlement} />
            <SnapshotCard label="Comparable Cases Found" value={snap.comparable_cases_found != null ? String(snap.comparable_cases_found) : "0"} />
            <SnapshotCard label="Comparison Quality" value={snap.comparison_quality} />
          </div>
        </div>

        {/* 2. Why These Comparables Matter */}
        {data.why_comparables_matter && (
          <div>
            <SubSectionTitle icon={Info}>Why These Comparables Matter</SubSectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.why_comparables_matter}</p>
          </div>
        )}

        {/* 3. Similarity Breakdown */}
        {sims.length > 0 && (
          <div>
            <SubSectionTitle icon={GitCompareArrows}>Similarity Breakdown</SubSectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {sims.map((s, i) => <SimilarityBar key={i} item={s} />)}
            </div>
          </div>
        )}

        {/* 4. Top Comparable Cases */}
        {cases.length > 0 && (
          <div>
            <SubSectionTitle icon={Landmark}>Top Comparable Cases</SubSectionTitle>
            <div className="space-y-3">
              {cases.map((c, i) => <ComparableCaseCard key={i} caseData={c} index={i} />)}
            </div>
          </div>
        )}

        {/* 5. Valuation Drivers */}
        {(upward.length > 0 || downward.length > 0) && (
          <div>
            <SubSectionTitle icon={TrendingUp}>Valuation Drivers</SubSectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upward.length > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Upward Exposure Drivers
                  </p>
                  {upward.map((d, i) => <DriverItem key={i} driver={d} upward />)}
                </div>
              )}
              {downward.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3">
                  <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Downward Exposure Drivers
                  </p>
                  {downward.map((d, i) => <DriverItem key={i} driver={d} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Recommended Considerations */}
        {considerations.length > 0 && (
          <div>
            <SubSectionTitle icon={ClipboardCheck}>Recommended Considerations</SubSectionTitle>
            <div className="space-y-1.5">
              {considerations.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-border last:border-0">
                  <span className="w-4 h-4 rounded border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{c.item}</p>
                    {c.language && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{c.language}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Comparison Quality */}
        {quality.rating && (
          <div>
            <SubSectionTitle icon={ShieldCheck}>Comparison Quality</SubSectionTitle>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Quality Rating:</span>
                <Badge variant="outline" className={`text-xs font-semibold ${qualityStyle}`}>{quality.rating}</Badge>
              </div>
              {quality.supporting_reasons && (
                <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-medium">Supporting Reasons:</span> {quality.supporting_reasons}</p>
              )}
              {quality.missing_information && (
                <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-medium">Missing Information:</span> {quality.missing_information}</p>
              )}
              {quality.warnings && (
                <p className="text-xs text-amber-700 leading-relaxed"><span className="font-medium">Warnings:</span> {quality.warnings}</p>
              )}
            </div>
          </div>
        )}

        {/* 8. Defense / Plaintiff Perspectives */}
        {(showDefense && data.defense_perspective) || (showPlaintiff && data.plaintiff_perspective) ? (
          <div>
            <SubSectionTitle icon={Gavel}>Perspective Analysis</SubSectionTitle>
            <div className="space-y-3">
              {showDefense && data.defense_perspective && (
                <div className={`rounded-lg border p-3 ${perspective === "defense" ? "border-blue-300 bg-blue-50/50" : "border-border"}`}>
                  <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Defense Perspective
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.defense_perspective}</p>
                </div>
              )}
              {showPlaintiff && data.plaintiff_perspective && (
                <div className={`rounded-lg border p-3 ${perspective === "plaintiff" ? "border-rose-300 bg-rose-50/50" : "border-border"}`}>
                  <p className="text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Plaintiff Perspective
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.plaintiff_perspective}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Bottom Guardrail */}
        <div className="rounded-lg bg-muted/50 border border-border p-2.5">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            This Comparative Verdict Intelligence is decision support only. ClaimIntel does not invent verdicts or settlements.
            If no comparable verdict data is available, the analysis is based on claim facts only and labeled as speculative.
            The final outcome remains with the adjuster.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}