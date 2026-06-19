import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import FollowUpMessage from "./FollowUpMessage";

const SECTION_KEYS = [
  "executive_summary", "coverage_summary", "coverage_issues", "liability_assessment",
  "damages_summary", "medical_treatment_summary", "litigation_status",
  "venue_exposure_analysis", "settlement_evaluation", "red_flags",
  "missing_information", "recommended_next_steps", "supervisor_review",
];

const SUGGESTED_QUESTIONS = [
  "What additional records should be requested?",
  "What are the strongest liability defenses?",
  "What facts support the claimant's position?",
  "What reserve concerns exist?",
  "What should defense counsel investigate?",
  "What factors may increase settlement value?",
];

export default function FollowUpAssistant({ review }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (review.follow_up_messages) {
      try { setMessages(JSON.parse(review.follow_up_messages)); } catch {}
    }
  }, [review.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const buildContext = () => {
    const parts = [
      `Claim: ${review.claim_name}`, `Claim #: ${review.claim_number}`,
      `Date of Loss: ${review.date_of_loss}`, `Jurisdiction: ${review.jurisdiction}`,
      `Line of Business: ${review.line_of_business}`,
    ];
    if (review.venue_risk_level) parts.push(`Venue Risk: ${review.venue_risk_level}`);
    if (review.liability_allocation_summary) parts.push(`Liability: ${review.liability_allocation_summary}`);
    if (review.confidence_level) parts.push(`Confidence: ${review.confidence_level}`);
    parts.push("");

    SECTION_KEYS.forEach((key) => {
      if (review[key]) {
        const title = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        parts.push(`=== ${title} ===\n${review[key]}`);
      }
    });

    if (review.claim_file_text) {
      const fileText = review.claim_file_text.length > 15000
        ? review.claim_file_text.slice(0, 15000) + "\n[...truncated for length]"
        : review.claim_file_text;
      parts.push(`\n=== ORIGINAL CLAIM FILE TEXT ===\n${fileText}`);
    }
    return parts.join("\n");
  };

  const saveMessages = async (msgs) => {
    await base44.entities.ClaimReview.update(review.id, {
      follow_up_messages: JSON.stringify(msgs),
    });
  };

  const handleSubmit = async (questionOverride) => {
    const question = questionOverride || input.trim();
    if (!question || isLoading) return;
    setInput("");

    const userMsg = { role: "user", content: question };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    const history = updated
      .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.analysis || ""}`))
      .join("\n\n");

    const prompt = `You are the ClaimIntel Follow-Up Assistant. You answer follow-up questions about a specific insurance claim based ONLY on the uploaded documents and generated Claims Intelligence Report below.

STRICT RULES:
- Answer ONLY from the claim documents and report below. Do NOT use outside information.
- Do NOT provide legal advice.
- Do NOT invent facts. Reference only information present in the documents.
- If information is unavailable, state: "The claim file does not contain sufficient information to address this question."
- Reference relevant portions of the report when applicable.
- Clearly separate factual observations from recommendations.
- Use professional insurance claims terminology.

CLAIMS INTELLIGENCE REPORT:
${buildContext()}

${updated.length > 1 ? `CONVERSATION HISTORY:\n${history}` : ""}

USER QUESTION: ${question}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          analysis: { type: "string", description: "Detailed response to the question" },
          supporting_information: { type: "string", description: "Bullet-pointed list of relevant facts from the claim file and report" },
          recommended_next_steps: { type: "string", description: "Actionable next steps if applicable" },
        },
      },
    });

    const assistantMsg = {
      role: "assistant",
      question,
      analysis: result.analysis,
      supporting_information: result.supporting_information,
      recommended_next_steps: result.recommended_next_steps,
    };

    const finalMsgs = [...updated, assistantMsg];
    setMessages(finalMsgs);
    setIsLoading(false);
    await saveMessages(finalMsgs);
  };

  const clearConversation = async () => {
    setMessages([]);
    await saveMessages([]);
    toast.success("Conversation cleared");
  };

  const exportConversation = () => {
    if (messages.length === 0) return;
    let text = `CLAIMINTEL FOLLOW-UP CONVERSATION\nClaim: ${review.claim_name} (${review.claim_number})\nExported: ${new Date().toLocaleString()}\n${"=".repeat(60)}\n\n`;
    messages.forEach((msg) => {
      if (msg.role === "user") {
        text += `QUESTION:\n${msg.content}\n\n`;
      } else {
        text += `CLAIMINTEL ANALYSIS:\n${msg.analysis || ""}\n\nSUPPORTING INFORMATION:\n${msg.supporting_information || ""}\n\nRECOMMENDED NEXT STEPS:\n${msg.recommended_next_steps || ""}\n\n${"—".repeat(40)}\n\n`;
      }
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ClaimIntel_FollowUp_${review.claim_number || "conversation"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  return (
    <Card className="shadow-sm border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">ClaimIntel Follow-Up Assistant</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ask follow-up questions about the claim, documents, and analysis
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={exportConversation} className="text-xs h-7">
                <Download className="w-3 h-3 mr-1" />Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearConversation} className="text-xs h-7 text-muted-foreground">
                <Trash2 className="w-3 h-3 mr-1" />Clear
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation */}
        {messages.length > 0 && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <FollowUpMessage key={i} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-dashed">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing claim file...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question about this claim..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
          Responses are based only on the uploaded claim documents and generated intelligence report. This is not legal advice.
        </p>
      </CardContent>
    </Card>
  );
}