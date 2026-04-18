import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export function ProfileTab() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, university, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setUsername(data.username ?? "");
        setUniversity(data.university ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, [user]);

  const initials = (fullName || user?.email || "U").slice(0, 2).toUpperCase();

  const handleAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image trop lourde (max 2 Mo)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      setAvatarUrl(url);
      toast.success("Photo mise à jour");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), username: username.trim(), university: university.trim() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil enregistré");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Informations affichées dans l'application et le classement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f); }}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Photo de profil</p>
            <p className="text-xs text-muted-foreground">JPG ou PNG, max 2 Mo.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Yash Dupont" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yash" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="university">Université / Faculté</Label>
            <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Sorbonne, Lyon-Est, ..." />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">User ID :</span> <code className="font-mono">{user?.id}</code>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (user) { navigator.clipboard.writeText(user.id); toast.success("ID copié"); } }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
