import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  BarChart3,
  Trophy,
  BookOpen,
  Puzzle,
  GraduationCap,
  Swords,
  Calendar,
  Timer,
  Megaphone,
  Users,
  BookX,
  FileText,
  Archive,
  Brain,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, canAccessExamsKhollesAnnales } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface NavItem {
  title: string;
  path: string;
  icon: any;
  isNew?: boolean;
  restricted?: boolean;
  adminHidden?: boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
  adminHidden?: boolean;
}

const allNavGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { title: "Dashboard", path: "/", icon: LayoutGrid },
      { title: "Statistiques", path: "/statistiques", icon: BarChart3, isNew: true, adminHidden: true },
      { title: "Classement", path: "/classement", icon: Trophy, isNew: true, adminHidden: true },
    ],
  },
  {
    label: "Apprentissage",
    items: [
      { title: "Cours", path: "/", icon: BookOpen },
      { title: "Apprentissage", path: "/learning", icon: Brain, adminHidden: true },
      { title: "Modules Interactifs", path: "/modules", icon: Puzzle },
      { title: "Khôlles", path: "/kholles", icon: GraduationCap, restricted: true, adminHidden: true },
      { title: "Battles", path: "/battles", icon: Swords, isNew: true, adminHidden: true },
    ],
  },
  {
    label: "Productivité",
    items: [
      { title: "Planning", path: "/schedule", icon: Calendar },
      { title: "Pomodoro", path: "/pomodoro", icon: Timer, adminHidden: true },
      { title: "Cahier d'erreurs", path: "/errors", icon: BookX, adminHidden: true },
      { title: "Examens Blancs", path: "/exams", icon: FileText, restricted: true, adminHidden: true },
      { title: "Annales", path: "/annales", icon: Archive, restricted: true, adminHidden: true },
    ],
  },
  {
    label: "Administration",
    adminHidden: false,
    items: [
      { title: "Annonces", path: "/announcements", icon: Megaphone, adminOnly: true },
      { title: "Affiliés", path: "/affiliates", icon: Users, adminOnly: true },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { role, isAdmin, user } = useAuth();
  const { isSubscribed } = useSubscription();

  const filteredGroups = allNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isAdmin && item.adminHidden) return false;
        if (!isAdmin && item.adminOnly) return false;
        if (item.restricted && !canAccessExamsKhollesAnnales(role)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Étudiant";
  const initial = displayName.charAt(0).toUpperCase();
  const planLabel = isAdmin ? "Admin" : isSubscribed ? "Premium" : "Freemium";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Profile card */}
      <div className="px-3 pt-4 pb-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/60 border border-sidebar-border px-2.5 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-sidebar-accent-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {planLabel === "Premium" && <Crown className="h-3 w-3 text-warning" />}
              {planLabel} plan
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4 scrollbar-thin">
        {filteredGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((navItem) => {
                const isActive =
                  navItem.path === "/"
                    ? location.pathname === "/"
                    : location.pathname === navItem.path ||
                      location.pathname.startsWith(navItem.path + "/");

                return (
                  <Link
                    key={navItem.path + navItem.title}
                    to={navItem.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <navItem.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 truncate">{navItem.title}</span>
                    {navItem.isNew && (
                      <span className="inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        New
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
