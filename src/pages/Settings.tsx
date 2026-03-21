import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
            <p className="text-sm text-muted-foreground">Gérer votre compte</p>
          </div>
        </div>
      </motion.div>

      {/* Debug: User ID */}
      {user && (
        <div className="rounded-xl border border-border bg-muted/50 p-4 text-xs text-muted-foreground">
          <span className="font-medium">User ID :</span>{" "}
          <code
            className="cursor-pointer select-all rounded bg-muted px-1.5 py-0.5 font-mono hover:text-foreground transition-colors"
            onClick={() => { navigator.clipboard.writeText(user.id); toast.success("ID copié !"); }}
          >
            {user.id}
          </code>
        </div>
      )}
    </div>
  );
}
