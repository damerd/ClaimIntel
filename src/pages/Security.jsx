import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Lock,
  Users,
  FileLock,
  ScrollText,
  KeyRound,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SECTIONS = [
  {
    icon: KeyRound,
    title: "Secure Authentication",
    body: `All users must authenticate before accessing any ClaimIntel feature. Registration requires email and password. Password reset and email verification flows are supported. All routes are protected — unauthenticated users are redirected to the login page. Sessions are managed with secure tokens. The platform is designed to support future Multi-Factor Authentication (MFA) and Single Sign-On (SSO).`,
  },
  {
    icon: Users,
    title: "Role-Based Permissions",
    body: `ClaimIntel implements role-based access control with the following user roles: Admin, Beta User, Professional User, and Enterprise User. Each role has specific permissions and feature access. Administrators have unrestricted access for development and platform management. Beta users are limited to two complimentary reviews. Professional and Enterprise users receive unlimited reviews with tier-appropriate features.`,
  },
  {
    icon: FileLock,
    title: "User Data Isolation",
    body: `Each user can only access their own uploaded documents and generated reports. Data isolation is enforced at the database level through row-level security. No user can view, edit, or delete another user's data unless they have administrative privileges.`,
  },
  {
    icon: Lock,
    title: "Encrypted Document Handling",
    body: `Documents uploaded to ClaimIntel are processed through secure infrastructure. Document text is extracted and stored in an access-controlled database. All communication between your browser and ClaimIntel servers uses encrypted transport (HTTPS/TLS).`,
  },
  {
    icon: ScrollText,
    title: "Audit Logging",
    body: `ClaimIntel maintains comprehensive audit logs recording user registration, login attempts (successful and failed), logouts, claim review creation, document uploads and deletions, report generation and exports, saved report access, pricing inquiries, upgrade requests, and all administrative actions. Each audit entry includes user ID, email, action, timestamp, related claim ID, and success/failure status. Audit logs are immutable and accessible only to administrators.`,
  },
  {
    icon: ShieldCheck,
    title: "Secure Report Access",
    body: `Generated intelligence reports are private to the account that created them. Reports can be exported as PDF, Microsoft Word, or plain text. Export actions are recorded in the audit log. Report access requires authenticated sessions.`,
  },
  {
    icon: AlertTriangle,
    title: "Beta Environment Limitations",
    body: `ClaimIntel is currently in a beta development phase. While we implement security best practices, the beta environment should not be used with confidential, privileged, medical, legal, or personally identifiable claim information. Beta users are limited to two complimentary AI-powered reviews and ten saved reports. All data should be considered potentially retained for testing and development purposes.`,
  },
  {
    icon: ShieldCheck,
    title: "Responsible AI Use",
    body: `ClaimIntel's AI only uses facts found in the documents you provide. It does not create facts, make assumptions, or provide legal advice. AI-generated content clearly separates factual findings from recommendations. The AI uses professional insurance claims language and includes source references. All AI-generated outputs include a watermark indicating they were generated during the ClaimIntel Beta.`,
  },
];

export default function Security() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How ClaimIntel protects your data and maintains platform security
        </p>
      </div>

      <Card className="shadow-sm border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            ClaimIntel is currently in beta. Do not upload confidential, privileged, medical, legal, or personally identifiable claim information unless you are authorized to do so.
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
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          Security questions? Contact us through the Request Access page.
        </p>
        <p className="text-xs text-muted-foreground mt-1">ClaimIntel © 2026 — Smarter Claims. Better Decisions.</p>
      </div>
    </div>
  );
}