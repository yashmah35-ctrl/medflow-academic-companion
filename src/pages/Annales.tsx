import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, Plus, BarChart3, Archive } from "lucide-react";
import { toast } from "sonner";

const annalesMock = [
  { id: 1, subject: "Chimie", year: "2023-2024", session: "S1", pages: 12, analyzed: true },
  { id: 2, subject: "Anatomie", year: "2023-2024", session: "S1", pages: 8, analyzed: true },
  { id: 3, subject: "Bio Cellulaire", year: "2022-2023", session: "S2", pages: 10, analyzed: false },
];

const topTopics = [
  { topic: "Enzymologie", count: 8, subject: "Chimie" },
  { topic: "Membrane cellulaire", count: 6, subject: "Bio Cellulaire" },
  { topic: "Membre supérieur", count: 5, subject: "Anatomie" },
  { topic: "Optique géométrique", count: 4, subject: "Biophysique" },
  { topic: "Glucides", count: 4, subject: "Chimie" },
];

export default function Annales() {
  const [annales] = useState(annalesMock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.success(`${files.length} fichier(s) importé(s) ! L'analyse est en cours...`);
    }
    e.target.value = "";
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.success("Photo capturée ! L'analyse est en cours...");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Annales</h1>
          <p className="text-muted-foreground mt-1">Analyse les sujets des années passées pour cibler tes révisions.</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter des Annales
        </Button>
      </div>

      {/* Upload */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center"
      >
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <Upload className="h-6 w-6" />
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors cursor-pointer"
          >
            <Camera className="h-6 w-6" />
          </button>
        </div>
        <p className="font-medium text-foreground">Importer des annales</p>
        <p className="text-sm text-muted-foreground mt-1">Plusieurs pages supportées. L'IA analysera les sujets les plus fréquents.</p>
      </motion.div>

      {/* Top topics */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Sujets les plus tombés</h3>
        </div>
        <div className="space-y-3">
          {topTopics.map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{t.topic}</span>
                <Badge variant="secondary" className="text-xs">{t.subject}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-primary/20" style={{ width: `${t.count * 12}px` }}>
                  <div className="h-full rounded-full bg-primary" style={{ width: "100%" }} />
                </div>
                <span className="text-xs text-muted-foreground">{t.count}×</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Annales list */}
      <div className="space-y-3">
        {annales.map((a) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{a.subject} — {a.year}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Session {a.session} • {a.pages} pages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={a.analyzed ? "default" : "secondary"} className="text-xs">{a.analyzed ? "Analysé" : "En cours"}</Badge>
              <Button variant="outline" size="sm" disabled={!a.analyzed}>S'entraîner</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
