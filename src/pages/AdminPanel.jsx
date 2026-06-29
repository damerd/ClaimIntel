import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useAdminMode } from "@/lib/useAdminMode";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ScrollText,
  Users,
  ShieldCheck,
  RotateCcw,
  FileText,
  Download,
  Lock,
  Settings,
  LogOut,
  Building2,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "audit", label: "Audit Logs", icon: ScrollText },
  { key: "users", label: "User Management", icon: Users },
  { key: "activity", label: "User Activity", icon: Activity },
  { key: "roles", label: "Role Management", icon: ShieldCheck },
  { key: "reset", label: "Reset Beta Usage", icon: RotateCcw },
  { key: "report-test", label: "Report Testing", icon: FileText },
  { key: "export-test", label: "Export Testing", icon: Download },
  { key: "security-test", label: "Security Testing", icon: Lock },
  { key: "privacy-test", label: "Privacy Testing", icon: ShieldCheck },
  { key: "enterprise-test", label: "Enterprise Features", icon: Building2 },
  { key: "settings", label: "System Settings", icon: Settings },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const { adminMode, disableAdminMode } = useAdminMode(user);
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");

  if (!adminMode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Lock className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Admin Mode is not active.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Admin Panel</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
              Admin Mode
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Administrative tools for development, testing, and platform management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            disableAdminMode();
            navigate("/");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Exit Admin Mode
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "dashboard" && <AdminDashboard />}
      {tab === "audit" && <AuditLogsTab />}
      {tab === "users" && <UserManagementTab />}
      {tab === "activity" && <UserActivityTab />}
      {tab === "roles" && <RoleManagementTab />}
      {tab === "reset" && <ResetBetaTab />}
      {tab === "report-test" && <ReportTestingTab />}
      {tab === "export-test" && <ExportTestingTab />}
      {tab === "security-test" && <SecurityTestingTab />}
      {tab === "privacy-test" && <PrivacyTestingTab />}
      {tab === "enterprise-test" && <EnterpriseTestingTab />}
      {tab === "settings" && <SystemSettingsTab />}
    </div>
  );
}

function AdminDashboard() {
  const { data: reviews = [] } = useQuery({
    queryKey: ["adminReviews"],
    queryFn: () => base44.entities.ClaimReview.list("-created_date", 100),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 100),
  });

  const stats = [
    { label: "Total Reviews", value: reviews.length, icon: FileText, color: "bg-primary/10 text-primary" },
    { label: "Reviewed", value: reviews.filter((r) => r.status === "reviewed").length, icon: FileText, color: "bg-emerald-50 text-emerald-600" },
    { label: "Drafts", value: reviews.filter((r) => r.status === "draft").length, icon: FileText, color: "bg-amber-50 text-amber-600" },
    { label: "Audit Entries", value: logs.length, icon: ScrollText, color: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have unrestricted access to the platform. Beta restrictions are bypassed. You can create unlimited claim reviews, upload unlimited documents, generate unlimited reports, view all saved reports, export reports, and access all Professional and Enterprise features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogsTab() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 200),
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No audit entries recorded yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      log.success ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.user_email || "—"}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {log.created_date && format(new Date(log.created_date), "MMM d, yyyy HH:mm:ss")}
                  </p>
                  {log.related_claim_id && (
                    <p className="text-xs text-muted-foreground">Claim: {log.related_claim_id.slice(0, 8)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserManagementTab() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
              >
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.created_date && format(new Date(u.created_date), "MMM d, yyyy")}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    u.role === "admin"
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {u.role || "user"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserActivityTab() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["adminActivity"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 200),
  });

  const userActivity = {};
  logs.forEach((log) => {
    const email = log.user_email || "unknown";
    if (!userActivity[email]) userActivity[email] = { count: 0, lastAction: null, lastDate: null };
    userActivity[email].count++;
    if (!userActivity[email].lastDate || new Date(log.created_date) > new Date(userActivity[email].lastDate)) {
      userActivity[email].lastAction = log.action;
      userActivity[email].lastDate = log.created_date;
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
        ) : Object.keys(userActivity).length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No user activity recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(userActivity).map(([email, data]) => (
              <div
                key={email}
                className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
              >
                <div>
                  <p className="font-medium">{email}</p>
                  <p className="text-xs text-muted-foreground">Last: {data.lastAction}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{data.count} actions</p>
                  <p className="text-xs text-muted-foreground">
                    {data.lastDate && format(new Date(data.lastDate), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RoleManagementTab() {
  const roles = [
    { name: "Admin", desc: "Unrestricted access to all features, no beta limits, full admin panel access" },
    { name: "Beta User", desc: "Two complimentary reviews, unlimited document uploads, 10 saved reports max" },
    { name: "Professional", desc: "Unlimited reviews, professional feature access" },
    { name: "Enterprise", desc: "Unlimited reviews, team management, organization dashboards, enterprise features" },
  ];
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Role Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {roles.map((r) => (
          <div key={r.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <p className="font-medium text-sm">{r.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ResetBetaTab() {
  const { data: reviews = [] } = useQuery({
    queryKey: ["adminResetReviews"],
    queryFn: () => base44.entities.ClaimReview.list("-created_date", 100),
  });

  const resetBeta = async () => {
    try {
      await base44.entities.ClaimReview.deleteMany({ status: "reviewed" });
      toast.success("Beta usage reset", { description: "All reviewed claims have been deleted." });
    } catch (e) {
      toast.error("Failed to reset beta usage");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reset Beta Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          This will delete all completed ("reviewed") claims, resetting the beta review counter to zero. Current reviews: {reviews.filter((r) => r.status === "reviewed").length}
        </p>
        <Button variant="destructive" onClick={resetBeta}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Beta Usage
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportTestingTab() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Report Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Admin users can test report generation without beta restrictions. Navigate to New Analysis to create unlimited claim reviews with all report sections available.
        </p>
        <div className="mt-4">
          <a href="/new-review">
            <Button>Go to New Analysis</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportTestingTab() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Export Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Test PDF, Microsoft Word, and Text export functionality from any saved report's export menu. Admin users have unrestricted export access.
        </p>
        <div className="mt-4">
          <a href="/saved-reviews">
            <Button variant="outline">Go to Saved Reports</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTestingTab() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Security Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Test the following security features:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Protected routes (redirect unauthenticated users)</li>
          <li>Role-based access control</li>
          <li>User data isolation</li>
          <li>Audit logging</li>
          <li>Secure authentication flows</li>
        </ul>
      </CardContent>
    </Card>
  );
}

function PrivacyTestingTab() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Privacy Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Test privacy-related functionality:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Privacy Policy page accessibility</li>
          <li>Data deletion request flow</li>
          <li>User data isolation verification</li>
          <li>Audit log immutability</li>
        </ul>
      </CardContent>
    </Card>
  );
}

function EnterpriseTestingTab() {
  const features = [
    "Multi-Factor Authentication (MFA)",
    "Single Sign-On (SSO)",
    "Enterprise Audit Logs",
    "Custom Branding",
    "White-Label Deployments",
    "API Access",
    "Claims Management System Integrations",
    "Analytics Dashboard",
    "Team Performance Metrics",
    "Workflow Automation",
    "AI Model Customization",
    "Multi-Office Administration",
    "Enterprise Reporting",
    "Compliance & Governance Tools",
    "Custom Data Retention Policies",
    "Dedicated Cloud Environments",
  ];
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Enterprise Feature Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The following enterprise capabilities are designed for future enablement without platform redesign:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 p-2 rounded-lg border text-sm">
              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SystemSettingsTab() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">System Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Platform configuration and system-level settings.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Beta review limit: 2</li>
          <li>Maximum saved reports (beta): 10</li>
          <li>Admin Mode: Active</li>
          <li>Authentication: Required for all routes</li>
          <li>Audit logging: Enabled</li>
        </ul>
      </CardContent>
    </Card>
  );
}