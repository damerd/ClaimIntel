import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLogger";

export default function DataDeletionRequest() {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    logAuditEvent("data_deletion_request", { metadata: { reason } });
    setSubmitted(true);
    toast.success("Data deletion request submitted", {
      description: "Your request will be processed within 30 days.",
    });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="font-heading text-xl font-bold">Request Submitted</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your data deletion request has been submitted and will be processed within 30 days. You will receive confirmation at your registered email address. Audit log entries may be retained for security and compliance purposes.
            </p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setReason(""); }}>
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Data Deletion Request</h1>
        <p className="text-sm text-muted-foreground mt-1">Request deletion of your account data</p>
      </div>

      <Card className="shadow-sm border-amber-200 bg-amber-50/50">
        <CardContent className="py-4 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            Submitting this request will schedule deletion of your account data including uploaded documents and generated reports. This action is irreversible. Audit log entries may be retained for security purposes.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you're requesting data deletion..."
              className="min-h-[100px] text-sm"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Submit Data Deletion Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}