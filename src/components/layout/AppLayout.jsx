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
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ClaimIntelLogo from "@/components/brand/ClaimIntelLogo";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/new-review", label: "New Analysis", icon: FilePlus },
  { path: "/saved-reviews", label: "Saved Reports", icon: FolderOpen },
  { path: "/pricing", label: "Pricing", icon: CreditCard },
  { path: "/documentation", label: "Documentation", icon: BookOpen },
  { path: "/request-access", label: "Request Access", icon: UserPlus },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[hsl(222,47%,13%)] text-white fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-white/10">
          <ClaimIntelLogo size={36} variant="light" showTagline tagline="Smarter Claims. Better Decisions." />
        </div>
        <nav className="flex-1 p-4 space-y-1">
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
        <div className="p-4 m-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-[11px] text-white/60 leading-relaxed">
              Prototype only. Do not upload real claim data.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-[hsl(222,47%,13%)] text-white px-4 py-3 flex items-center justify-between">
          <ClaimIntelLogo size={28} variant="light" />
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-white hover:bg-white/10">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="bg-[hsl(222,47%,13%)] w-64 h-full p-4 pt-20" onClick={(e) => e.stopPropagation()}>
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
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}