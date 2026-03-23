import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Calendar,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const studentTabs = [
  { title: "Accueil", path: "/", icon: Home },
  { title: "Cours", path: "/learning", icon: BookOpen },
  { title: "Modules", path: "/modules", icon: Brain },
  { title: "Planning", path: "/schedule", icon: Calendar },
  { title: "Réglages", path: "/settings", icon: Settings },
];

const adminTabs = [
  { title: "Matières", path: "/", icon: BookOpen },
  { title: "Annonces", path: "/announcements", icon: Home },
  { title: "Affiliés", path: "/affiliates", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? adminTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around h-16 px-1 pb-safe">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {tab.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
