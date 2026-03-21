import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuestionImageUploadProps {
  imageUrl: string | undefined;
  onImageChange: (url: string | undefined) => void;
}

export function QuestionImageUpload({ imageUrl, onImageChange }: QuestionImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées");
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${crypto.randomUUID()}/${safeName}`;
      const { error } = await entSupabase.storage.from("subjects").upload(path, file);
      if (error) throw error;
      const { data: urlData } = entSupabase.storage.from("subjects").getPublicUrl(path);
      onImageChange(urlData.publicUrl);
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2">
      {imageUrl ? (
        <div className="relative inline-block">
          <img src={imageUrl} alt="Image de l'énoncé" className="max-h-40 rounded-lg border border-border object-contain" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => onImageChange(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">{uploading ? "Upload..." : "Ajouter une image"}</span>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
