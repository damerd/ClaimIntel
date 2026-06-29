import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield, FileWarning, Info, Scale, ShieldCheck, Lock, FileText, Trash2, KeyRound, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const QUICK_LINKS = [
  { path: "/privacy", label: "Privacy Policy", icon: ShieldCheck, desc: "How we collect, use, and protect your information" },
  { path: "/security", label: "Security", icon: Lock, desc: "Platform security and data protection measures" },
  { path: "/terms", label: "Terms of Use", icon: FileText, desc: "Terms and conditions for using ClaimIntel" },
  { path: "/data-deletion", label: "Data Deletion Request", icon: Trash2, desc: "Request deletion of your account data" },
];

export default function SettingsDisclaimer() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Account management, privacy, and security</p>
      </div>

      {/* Prominent Beta Notice */}
      <Card className="shadow-sm border-amber-300 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            Beta Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-900 leading-relaxed font-medium">
            ClaimIntel is currently in beta. Do not upload confidential, privileged, medical, legal, or personally identifiable claim information unless you are authorized to do so and understand your organization's privacy, confidentiality, and regulatory obligations.
          </p>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.path} to={link.path}>
            <Card className="shadow-sm hover:shadow-md hover:border-primary/30 transition-all h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <link.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{link.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{link.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Account Management */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <User className="w-5 h-5 text-primary" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account is managed through secure authentication. To update your profile information, use the account settings available through your user session.
          </p>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <KeyRound className="w-5 h-5 text-primary" />
            Password Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you need to reset your password, use the "Forgot Password" link on the login page. Password reset is handled securely through email verification.
          </p>
          <Link to="/forgot-password">
            <a className="text-sm text-primary hover:underline font-medium">Reset Password →</a>
          </Link>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <Info className="w-5 h-5 text-blue-600" />
            About This Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            ClaimIntel is an AI-powered claims intelligence platform designed to help adjusters, analysts, supervisors, risk managers, and claims leaders transform claim files into actionable intelligence.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform analyzes claim documentation and generates structured evaluations covering coverage, liability allocation, damages, medical treatment, venue exposure, litigation posture, settlement considerations, and supervisor-level recommendations.
          </p>
        </CardContent>
      </Card>

      {/* AI Rules */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <Shield className="w-5 h-5 text-primary" />
            AI Analysis Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              "Only summarizes facts found in the uploaded claim file.",
              "If information is missing, it is listed under \"Missing Information.\"",
              "Does not create facts or make assumptions about the claim.",
              "Does not make legal conclusions or provide legal advice.",
              "Does not recommend final settlement authority unless the file provides clear support.",
              "Clearly separates facts from recommendations.",
              "Uses a professional insurance claims tone throughout.",
              "Includes source references such as \"Based on claim file text provided.\"",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Data Privacy */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <FileWarning className="w-5 h-5 text-red-600" />
            Data & Privacy Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This application is currently in beta. Please be aware of the following:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Do not enter any real personal, medical, legal, or confidential claim information.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              All data entered is processed by AI and stored in the application database.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Use only fictional, dummy, or sample data for testing purposes.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              The sample claim provided is entirely fictional and does not represent any real claim.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <Scale className="w-5 h-5 text-purple-600" />
            Not Legal Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The output generated by this application is not legal advice. It is a demonstration of AI-assisted claim file summarization. No attorney-client relationship is created by use of this application. Actual claims handling decisions should be made by qualified claims professionals and legal counsel.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground font-medium">ClaimIntel © 2026</p>
        <p className="text-xs text-muted-foreground mt-0.5">Smarter Claims. Better Decisions.</p>
        <p className="text-xs text-muted-foreground mt-0.5">Educational & Portfolio Prototype</p>
      </div>
    </div>
  );
}