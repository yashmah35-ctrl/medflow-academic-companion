import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { CreditsBadge } from "@/components/credits/CreditsBadge";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { user, signOut, isAdmin } = useAuth();
  const { announcements, readIds, unreadCount, markAsRead } = useAnnouncements();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Étudiant";
  const initials = displayName.slice(0, 2).toUpperCase();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return dateStr; }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{isAdmin ? "Administration 🛠️" : "Bienvenue 👋"}</h2>
        <p className="text-sm text-muted-foreground">{isAdmin ? "Gérez les contenus de la plateforme" : "Prêt à réviser aujourd'hui ?"}</p>
      </div>

      <div className="flex items-center gap-3">
        {!isAdmin && <CreditsBadge />}
        {!isAdmin && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="border-b border-border px-4 py-3">
              <p className="font-semibold text-sm">Notifications</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune notification</p>
              )}
              {announcements.map((a) => {
                const isRead = readIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-accent/20 transition-colors ${!isRead ? "bg-accent/30" : ""}`}
                    onClick={() => {
                      markAsRead(a.id);
                      if (a.link_url) navigate(a.link_url);
                    }}
                  >
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(a.created_at)}</p>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
