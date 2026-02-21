import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, Plus, BookOpen, Play } from "lucide-react";
import { toast } from "sonner";

const khollesMock = [
  { id: 1, subject: "Chimie", date: "20 Jan 2025", questionCount: 12, extracted: true },
  { id: 2, subject: "Anatomie", date: "18 Jan 2025", questionCount: 8, extracted: true },
  { id: 3, subject: "Biophysique", date: "15 Jan 2025", questionCount: 10, extracted: false },
];

export default function Kholles() {
  const [kholles] = useState(khollesMock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.success(`${files.length} fichier(s) importé(s) avec succès ! L'extraction est en cours...`);
    }
    e.target.value = "";
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.success("Photo capturée ! L'extraction est en cours...");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Khôlles & Tutorat</h1>
          <p className="text-muted-foreground mt-1">
            Importe tes sujets de khôlles et entraîne-toi dessus.
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une Khôlle
        </Button>
      </div>

      {/* Upload zone */}
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
        <p className="font-medium text-foreground">Importer un sujet de khôlle</p>
        <p className="text-sm text-muted-foreground mt-1">
          Glisse-dépose tes fichiers ou prends une photo du sujet + correction
        </p>
      </motion.div>

      {/* Existing kholles */}
      <div className="space-y-3">
        {kholles.map((k) => (
          <motion.div
            key={k.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">Khôlle — {k.subject}</h4>
                  <Badge variant={k.extracted ? "default" : "secondary"} className="text-xs">
                    {k.extracted ? "Extrait" : "En cours"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {k.date} • {k.questionCount} questions
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled={!k.extracted}>
              <Play className="h-3 w-3 mr-1" /> S'entraîner
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
