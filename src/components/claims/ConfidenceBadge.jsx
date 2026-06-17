import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";

const levels = {
  High: { className: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Medium: { className: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Low: { className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

export default function ConfidenceBadge({ level }) {
  const config = levels[level] || levels.Medium;
  return (
    <div className="flex items-center gap-2">
      <Gauge className="w-4 h-4 text-muted-foreground" />
      <Badge variant="outline" className={`${config.className} text-xs font-medium px-3 py-1`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
        {level} Confidence
      </Badge>
    </div>
  );
}