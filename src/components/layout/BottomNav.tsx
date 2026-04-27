import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Calendar,
  Puzzle,
  BarChart3,
  Users,
  BookX,
  FileText,
  Archive,
  GraduationCap,
  X,
  Megaphone,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, canAccessExamsKhollesAnnales } from "@/hooks/useAuth";

interface SubItem {
  title: string;
  path: string;
  icon: any;
  restricted?: boolean;
}

interface Tab {
  title: string;
  path?: string;
  icon: any;
  subItems?: SubItem[];
}

const studentTabs: Tab[] = [
  { title: "Matières", path: "/dashboard", icon: BookOpen },
  { title: "Cours", path: "/cours", icon: BookOpen },
  { title: "Modules", path: "/modules", icon: Puzzle },
  { title: "Planning", path: "/schedule", icon: Calendar },
  {
    title: "Plus",
    icon: BarChart3,
    subItems: [
      { title: "Apprentissage actif", path: "/learning", icon: Brain },
      { title: "Cahier d'erreurs", path: "/errors", icon: BookX },
      { title: "Examens Blancs", path: "/exams", icon: FileText, restricted: true },
      { title: "Annales", path: "/annales", icon: Archive, restricted: true },
      { title: "Khôlles & Tutorat", path: "/kholles", icon: GraduationCap, restricted: true },
      { title: "Réglages", path: "/settings", icon: Settings },
    ],
  },
];

const adminTabs: Tab[] = [
  { title: "Matières", path: "/dashboard", icon: BookOpen },
  { title: "Planning", path: "/schedule", icon: Calendar },
  { title: "Annonces", path: "/announcements", icon: Megaphone },
  { title: "Affiliés", path: "/affiliates", icon: Users },
  { title: "Réglages", path: "/settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin, role } = useAuth();
  const tabs = isAdmin ? adminTabs : studentTabs;
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const isTabActive = (tab: Tab) => {
    if (tab.path) {
      return tab.path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(tab.path);
    }
    if (tab.subItems) {
      return tab.subItems.some((si) =>
        si.path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(si.path)
      );
    }
    return false;
  };

  return (
    <>
      {/* Overlay for sub-menu */}
      {openMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpenMenu(null)}
        />
      )}

      {/* Sub-menu popup */}
      {openMenu && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2 md:hidden">
          <div className="bg-card border border-border rounded-xl p-2 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {openMenu}
              </span>
              <button onClick={() => setOpenMenu(null)} className="p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {(tabs.find((t) => t.title === openMenu)?.subItems || [])
              .filter((si) => !si.restricted || canAccessExamsKhollesAnnales(role))
              .map((si) => {
                const active = location.pathname.startsWith(si.path);
                return (
                  <Link
                    key={si.path}
                    to={si.path}
                    onClick={() => setOpenMenu(null)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active ? "bg-primary/15 text-primary" : "text-foreground hover:bg-accent"
                    )}
                  >
                    <si.icon className="h-4 w-4" />
                    <span>{si.title}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around h-16 px-1 pb-safe">
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            const isOpen = openMenu === tab.title;

            if (tab.subItems) {
              return (
                <button
                  key={tab.title}
                  onClick={() => setOpenMenu(isOpen ? null : tab.title)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                    active || isOpen ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className={cn("text-[10px] font-medium", (active || isOpen) && "font-semibold")}>
                    {tab.title}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.path}
                to={tab.path!}
                onClick={() => setOpenMenu(null)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                  {tab.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
