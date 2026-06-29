import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Lock, FileText, Database, Trash2, AlertTriangle, Eye, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SECTIONS = [
  {
    icon: FileText,
    title: "Information We Collect",
    body: `ClaimIntel collects information you provide directly, including your name, email address, and account credentials during registration. When you upload claim documents for analysis, the text content of those documents is processed by our AI engine to generate structured intelligence reports. We also collect usage data such as login timestamps, actions performed, and interaction logs for security and audit purposes.`,
  },
  {
    icon: Database,
    title: "Uploaded Document Handling",
    body: `Documents you upload are processed to extract text for AI analysis. During the beta program, uploaded document text is stored in the application database and associated with your account. Each user can only access their own uploaded documents and generated reports. We do not share your documents with other users.`,
  },
  {
    icon: Eye,
    title: "AI Processing",
    body: `ClaimIntel uses AI language models to analyze claim file text and generate structured intelligence reports. The AI only uses facts found in the documents you provide. It does not create facts, make legal conclusions, or provide legal advice. AI processing occurs on secure infrastructure and results are stored associated with your account.`,
  },
  {
    icon: Lock,
    title: "Data Storage & Security",
    body: `Your data is stored in a secure, access-controlled database. User data isolation ensures each user can only access their own files and reports. Authentication is required for all access. Role-based access controls protect administrative and audit data. All user actions are recorded in immutable audit logs accessible only to administrators.`,
  },
  {
    icon: Clock,
    title: "Data Retention",
    body: `During the beta program, your data is retained for the duration of your account and may be deleted upon request. Beta users are limited to ten saved reports. Audit logs are retained indefinitely for security and compliance purposes. Enterprise customers can configure custom data retention policies.`,
  },
  {
    icon: Shield,
    title: "User Privacy",
    body: `We do not sell or share your personal information with third parties. Your claim documents and generated reports are private to your account. Administrators can access system-wide audit logs for security purposes but do not access individual claim content without authorization.`,
  },
  {
    icon: Trash2,
    title: "Data Deletion Requests",
    body: `You may request deletion of your account data at any time through the Settings page. Data deletion requests are processed within 30 days. Audit log entries may be retained for security and compliance purposes even after account data deletion. To submit a data deletion request, use the Data Deletion Request option in Settings or contact us.`,
  },
  {
    icon: AlertTriangle,
    title: "Beta Limitations & User Responsibilities",
    body: `ClaimIntel is currently in beta. Do not upload confidential, privileged, medical, legal, or personally identifiable claim information unless you are authorized to do so and understand your organization's privacy, confidentiality, and regulatory obligations. You are responsible for ensuring that any information you upload complies with your organization's data handling policies and applicable laws. The beta program includes two complimentary AI-powered claim reviews and a limit of ten saved reports.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How ClaimIntel collects, uses, and protects your information
        </p>
        <p className="text-xs text-muted-foreground mt-2">Last updated: June 2026</p>
      </div>

      <Card className="shadow-sm border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            ClaimIntel is currently in beta. Do not upload confidential, privileged, medical, legal, or personally identifiable claim information unless you are authorized to do so and understand your organization's privacy, confidentiality, and regulatory obligations.
          </p>
        </CardContent>
      </Card>

      {SECTIONS.map((section, i) => (
        <Card key={i} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <section.icon className="w-5 h-5 text-primary" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </CardContent>
        </Card>
      ))}

      <Separator />

      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">
          Questions about privacy? Contact us through the Request Access page.
        </p>
        <p className="text-xs text-muted-foreground mt-1">ClaimIntel © 2026 — Smarter Claims. Better Decisions.</p>
      </div>
    </div>
  );
}