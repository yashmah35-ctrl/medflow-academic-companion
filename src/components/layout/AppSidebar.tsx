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
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Matières", path: "/", icon: BookOpen },
  { title: "Emploi du temps", path: "/schedule", icon: Calendar },
  { title: "Apprentissage", path: "/learning", icon: Brain },
  { title: "Cahier d'erreurs", path: "/errors", icon: BookX },
  { title: "Khôlles & Tutorat", path: "/kholles", icon: GraduationCap },
  { title: "Examens Blancs", path: "/exams", icon: FileText },
  { title: "Annales", path: "/annales", icon: Archive },
  { title: "Modules", path: "/modules", icon: Puzzle },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          M
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-foreground tracking-tight">
            MedFlow
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
