import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Marker {
  id: number;
  x: number; // percentage 0-1
  y: number;
  label: string;
}

interface Subject {
  id: string;
  name: string;
}

interface SchemaCreatorProps {
  onBack: () => void;
  onSaved: () => void;
  subjects: Subject[];
  isAdmin: boolean;
  editSchema?: {
    id: string;
    title: string;
    subject_id: string | null;
    image_url: string;
    markers_json: Marker[];
    is_public: boolean;
  } | null;
}

export default function SchemaCreator({ onBack, onSaved, subjects, isAdmin, editSchema }: SchemaCreatorProps) {
  const { user } = useAuth();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(editSchema?.title ?? "");
  const [subjectId, setSubjectId] = useState(editSchema?.subject_id ?? "");
  const [imageUrl, setImageUrl] = useState(editSchema?.image_url ?? "");
  const [markers, setMarkers] = useState<Marker[]>(editSchema?.markers_json ?? []);
  const [isPublic, setIsPublic] = useState(editSchema?.is_public ?? isAdmin);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMarker, setEditingMarker] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `schemas/${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("course-files")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("course-files").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      setMarkers([]);
      toast.success("Image importée");
    } catch (err: any) {
      toast.error("Erreur upload: " + (err?.message || "Inconnu"));
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newId = markers.length > 0 ? Math.max(...markers.map(m => m.id)) + 1 : 1;
    const newMarker: Marker = { id: newId, x, y, label: "" };
    setMarkers(prev => [...prev, newMarker]);
    setEditingMarker(newId);
  }, [markers]);

  const updateMarkerLabel = (id: number, label: string) => {
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, label } : m));
  };

  const removeMarker = (id: number) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
    if (editingMarker === id) setEditingMarker(null);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim()) { toast.error("Titre requis"); return; }
    if (!imageUrl) { toast.error("Image requise"); return; }
    if (markers.length === 0) { toast.error("Ajoutez au moins un repère"); return; }
    if (markers.some(m => !m.label.trim())) { toast.error("Tous les repères doivent avoir un label"); return; }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        title: title.trim(),
        subject_id: subjectId || null,
        image_url: imageUrl,
        markers_json: markers as any,
        is_public: isAdmin ? isPublic : false,
      };

      if (editSchema) {
        const { error } = await supabase.from("schemas").update(payload).eq("id", editSchema.id);
        if (error) throw error;
        toast.success("Schéma mis à jour");
      } else {
        const { error } = await supabase.from("schemas").insert(payload);
        if (error) throw error;
        toast.success("Schéma créé");
      }
      onSaved();
    } catch (err: any) {
      toast.error("Erreur: " + (err?.message || "Inconnu"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {editSchema ? "Modifier le schéma" : "Nouveau schéma"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left: Image + markers */}
        <div className="space-y-3">
          {!imageUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Cliquez pour importer une image</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG</p>
                </>
              )}
            </div>
          ) : (
            <div className="relative rounded-xl border border-border overflow-hidden bg-card">
              <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/50">
                Cliquez sur l'image pour placer un repère
              </p>
              <div className="relative inline-block w-full">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Schema"
                  className="w-full h-auto cursor-crosshair select-none"
                  onClick={handleImageClick}
                  draggable={false}
                />
                {markers.map(m => (
                  <div
                    key={m.id}
                    className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer ring-2 ring-background"
                    style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                    onClick={(e) => { e.stopPropagation(); setEditingMarker(m.id); }}
                  >
                    {m.id}
                  </div>
                ))}
              </div>
              <div className="p-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { fileInputRef.current?.click(); }}>
                  Changer l'image
                </Button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Right: Settings + marker labels */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <Label>Titre</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Anatomie du cœur" />
            </div>
            <div>
              <Label>Matière</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                Visible par tous (La Prépa du Peuple)
              </label>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Repères ({markers.length})</h3>
            {markers.length === 0 && (
              <p className="text-xs text-muted-foreground">Cliquez sur l'image pour ajouter des repères</p>
            )}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {markers.map(m => (
                <div key={m.id} className={`flex items-center gap-2 p-2 rounded-lg ${editingMarker === m.id ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                  <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {m.id}
                  </span>
                  <Input
                    value={m.label}
                    onChange={e => updateMarkerLabel(m.id, e.target.value)}
                    placeholder="Label..."
                    className="h-8 text-sm"
                    onFocus={() => setEditingMarker(m.id)}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeMarker(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {editSchema ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
