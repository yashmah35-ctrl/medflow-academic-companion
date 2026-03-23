import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Trash2, Users, Megaphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { syncAllUsersToExternal } from "@/lib/externalUserSync";

const ROLE_OPTIONS = [
  { value: "all", label: "Tous les étudiants" },
  { value: "pass", label: "PASS" },
  { value: "lass", label: "L.AS" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "medical_student", label: "Étudiant médecine" },
];

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_roles: string[];
  link_url: string | null;
  created_at: string;
}

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("id, title, message, target_roles, link_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAnnouncements(data);
  };

  const toggleRole = (role: string) => {
    if (role === "all") {
      setSelectedRoles((prev) => prev.includes("all") ? [] : ["all"]);
      return;
    }
    setSelectedRoles((prev) => {
      const filtered = prev.filter((r) => r !== "all");
      return filtered.includes(role) ? filtered.filter((r) => r !== role) : [...filtered, role];
    });
  };

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Titre et message obligatoires");
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error("Sélectionne au moins un public cible");
      return;
    }
    if (!user) return;

    setSending(true);
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: title.trim(),
        message: message.trim(),
        target_roles: selectedRoles,
        link_url: linkUrl.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la publication");
      setSending(false);
      return;
    }

    if (data) {
      setAnnouncements((prev) => [data, ...prev]);
      setTitle("");
      setMessage("");
      setSelectedRoles([]);
      setLinkUrl("");
      toast.success("Annonce publiée ! Les étudiants la verront immédiatement.");
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Annonce supprimée");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dateStr; }
  };

  const getRoleLabel = (role: string) => ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Messages & Annonces</h2>
            <p className="text-sm text-muted-foreground">Publiez des messages visibles par les étudiants ciblés</p>
          </div>
        </div>
      </motion.div>

      {/* Create Announcement Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Send className="h-4 w-4" /> Nouvelle annonce
        </h3>

        <Input
          placeholder="Titre de l'annonce"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          placeholder="Votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <Input
          placeholder="Lien (optionnel) — ex: /subject/abc123"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />

        {/* Target roles */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" /> Public cible
          </p>
          <div className="flex flex-wrap gap-3">
            {ROLE_OPTIONS.map((role) => (
              <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRole(role.value)}
                />
                <span className="text-sm text-foreground">{role.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={handlePublish} disabled={sending} className="w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Publication..." : "Publier l'annonce"}
        </Button>
      </motion.div>

      {/* Announcements List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Annonces publiées</h3>
        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">Aucune annonce publiée</p>
        )}
        {announcements.map((a) => (
          <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-foreground">{a.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.message}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {a.target_roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">{getRoleLabel(r)}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(a.created_at)}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => handleDelete(a.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
