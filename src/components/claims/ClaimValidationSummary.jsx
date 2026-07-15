import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function MessageList({ items, icon: Icon, title, className }) {
  if (!items.length) return null;
  return (
    <div className={`rounded-lg border p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <ul className="mt-1.5 space-y-1 text-xs">
            {items.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ClaimValidationSummary({ validation }) {
  const blocking = validation?.blocking || [];
  const warnings = validation?.warnings || [];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {blocking.length ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <div>
            <p className="text-sm font-semibold">Claim Readiness Check</p>
            <p className="text-xs text-muted-foreground">
              {blocking.length
                ? "Resolve required items before generating the report. Advisory warnings do not block analysis."
                : "Required information is ready. Review advisory warnings before continuing."}
            </p>
          </div>
        </div>

        <MessageList
          items={blocking}
          icon={AlertTriangle}
          title="Required before analysis"
          className="border-destructive/30 bg-destructive/5 text-destructive"
        />
        <MessageList
          items={warnings}
          icon={Info}
          title="Advisory warnings"
          className="border-amber-300 bg-amber-50 text-amber-900"
        />
      </CardContent>
    </Card>
  );
}
