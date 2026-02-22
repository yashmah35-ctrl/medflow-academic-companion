import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Brain,
  BookX,
  GraduationCap,
  FileText,
  Archive,
  Puzzle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, canAccessExamsKhollesAnnales } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

interface NavItem {
  title: string;
  path: string;
  icon: any;
  restricted: boolean;
  adminHidden?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  adminHidden?: boolean;
}

const allNavGroups: NavGroup[] = [
  {
    label: "📚 Apprentissage",
    items: [
      { title: "Matières", path: "/", icon: BookOpen, restricted: false },
      { title: "Apprentissage", path: "/learning", icon: Brain, restricted: false, adminHidden: true },
      { title: "Modules", path: "/modules", icon: Puzzle, restricted: false, adminHidden: true },
      { title: "Emploi du temps", path: "/schedule", icon: Calendar, restricted: false, adminHidden: true },
    ],
  },
  {
    label: "📊 Performance",
    adminHidden: true,
    items: [
      { title: "Cahier d'erreurs", path: "/errors", icon: BookX, restricted: false },
      { title: "Examens Blancs", path: "/exams", icon: FileText, restricted: true },
      { title: "Annales", path: "/annales", icon: Archive, restricted: true },
    ],
  },
  {
    label: "🎓 Communauté",
    adminHidden: true,
    items: [
      { title: "Khôlles & Tutorat", path: "/kholles", icon: GraduationCap, restricted: true },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, isAdmin } = useAuth();

  const filteredGroups = allNavGroups
    .filter((group) => !(isAdmin && group.adminHidden))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isAdmin && item.adminHidden) return false;
        if (item.restricted && !canAccessExamsKhollesAnnales(role)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <img src={logo} alt="Logo" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        {!collapsed && (
          <span className="text-sm font-bold text-foreground tracking-tight leading-tight">
            La Prépa<br />du Peuple
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((navItem) => {
                const isActive = location.pathname === navItem.path ||
                  (navItem.path !== "/" && location.pathname.startsWith(navItem.path));
                const isHome = navItem.path === "/" && location.pathname === "/";
                const active = isActive || isHome;

                return (
                  <Link
                    key={navItem.path}
                    to={navItem.path}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
                    )}
                    <navItem.icon className={cn("h-5 w-5 shrink-0", active && "text-sidebar-primary")} />
                    {!collapsed && <span>{navItem.title}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
