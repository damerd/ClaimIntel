import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FilePlus, 
  FolderOpen, 
  Settings, 
  AlertTriangle,
  Menu,
  X,
  CreditCard,
  BookOpen,
  UserPlus,
  ShieldCheck,
  Lock,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AdminTriggerLogo from "@/components/brand/AdminTriggerLogo";
import { useAuth } from "@/lib/AuthContext";
import { useAdminMode } from "@/lib/useAdminMode";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/new-review", label: "New Analysis", icon: FilePlus },
  { path: "/saved-reviews", label: "Saved Reports", icon: FolderOpen },
  { path: "/pricing", label: "Pricing", icon: CreditCard },
  { path: "/documentation", label: "Documentation", icon: BookOpen },
  { path: "/request-access", label: "Request Access", icon: UserPlus },
  { path: "/security", label: "Security", icon: Lock },
  { path: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { adminMode } = useAdminMode(user);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[hsl(222,47%,13%)] text-white fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-white/10">
          <AdminTriggerLogo size={36} variant="light" showTagline tagline="Smarter Claims. Better Decisions." />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-primary"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {adminMode && (
          <Link to="/admin" className="mx-4 mb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/30 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Mode Active
            </div>
          </Link>
        )}
        <div className="p-4 m-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-white/80 font-semibold leading-relaxed">Beta Prototype</p>
              <p className="text-[11px] text-white/60 leading-relaxed mt-0.5">
                Do not upload confidential or sensitive claim information unless you are authorized to do so.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[hsl(222,47%,13%)] text-white px-4 py-3 flex items-center justify-between">
          <AdminTriggerLogo size={28} variant="light" />
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-white hover:bg-white/10">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="bg-[hsl(222,47%,13%)] w-64 h-full p-4 pt-20 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive ? "bg-accent text-primary" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 flex flex-col min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
        {/* Footer */}
        <footer className="border-t border-border bg-card mt-auto">
          <div className="p-4 md:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">ClaimIntel © 2026 — Smarter Claims. Better Decisions.</p>
            <div className="flex items-center gap-4 text-xs">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Privacy
              </Link>
              <Link to="/security" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Security
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" /> Terms
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}