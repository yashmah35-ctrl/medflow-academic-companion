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

const allNavItems = [
  { title: "Matières", path: "/", icon: BookOpen, restricted: false },
  { title: "Emploi du temps", path: "/schedule", icon: Calendar, restricted: false },
  { title: "Apprentissage", path: "/learning", icon: Brain, restricted: false },
  { title: "Cahier d'erreurs", path: "/errors", icon: BookX, restricted: false },
  { title: "Khôlles & Tutorat", path: "/kholles", icon: GraduationCap, restricted: true },
  { title: "Examens Blancs", path: "/exams", icon: FileText, restricted: true },
  { title: "Annales", path: "/annales", icon: Archive, restricted: true },
  { title: "Modules", path: "/modules", icon: Puzzle, restricted: false },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  const navItems = allNavItems.filter((item) => {
    if (item.restricted && !canAccessExamsKhollesAnnales(role)) return false;
    return true;
  });

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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const isHome = item.path === "/" && location.pathname === "/";
          const active = isActive || isHome;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", active && "text-sidebar-primary")} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
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
