import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function FollowUpMessage({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  const copyResponse = () => {
    const text = `Question:\n${message.question || ""}\n\nClaimIntel Analysis:\n${message.analysis || ""}\n\nSupporting Information:\n${message.supporting_information || ""}\n\nRecommended Next Steps:\n${message.recommended_next_steps || ""}`;
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard");
  };

  return (
    <div className="bg-muted/40 rounded-xl p-4 space-y-3 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">ClaimIntel Analysis</span>
        </div>
        <Button variant="ghost" size="sm" onClick={copyResponse} className="h-7 text-xs text-muted-foreground hover:text-foreground">
          <Copy className="w-3 h-3 mr-1" />Copy
        </Button>
      </div>

      <div className="text-sm leading-relaxed prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <ReactMarkdown>{message.analysis || ""}</ReactMarkdown>
      </div>

      {message.supporting_information && (
        <div className="pt-3 border-t border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Supporting Information</p>
          <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{message.supporting_information}</ReactMarkdown>
          </div>
        </div>
      )}

      {message.recommended_next_steps && (
        <div className="pt-3 border-t border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Recommended Next Steps</p>
          <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{message.recommended_next_steps}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}