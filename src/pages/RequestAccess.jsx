import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Users, Crown } from "lucide-react";
import { toast } from "sonner";

export default function RequestAccess() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", organization: "", role: "", interest: "Professional", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Request received", { description: "We'll be in touch as ClaimIntel Professional launches." });
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 mx-auto flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="font-heading text-2xl font-bold">Thank You</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Your request has been received. The ClaimIntel team will reach out as we expand access to Professional and Enterprise plans.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", organization: "", role: "", interest: "Professional", message: "" }); }}>
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Request Access</h1>
        <p className="text-sm text-muted-foreground mt-1">Join the waitlist for ClaimIntel Professional or Enterprise.</p>
      </div>

      <Card className="shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tell Us About You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email *</Label>
                <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Organization</Label>
                <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Adjuster" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">I'm interested in</Label>
              <div className="flex gap-2">
                {[
                  { val: "Professional", icon: Crown },
                  { val: "Enterprise", icon: Users },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setForm({ ...form, interest: opt.val })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                      form.interest === opt.val
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.val}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Message (Optional)</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us about your team's needs..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Submit Request</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}