import { Badge } from "@/components/ui/badge";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  analyzing: { label: "Analyzing", className: "bg-blue-50 text-blue-700 border-blue-200" },
  reviewed: { label: "Reviewed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { label: "Archived", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant="outline" className={`${config.className} text-xs font-medium px-2.5 py-0.5`}>
      {config.label}
    </Badge>
  );
}