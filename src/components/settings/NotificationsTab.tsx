import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Calendar, BookX } from "lucide-react";

interface Pref {
  key: string;
  title: string;
  description: string;
  icon: any;
  defaultOn: boolean;
}

const PREFS: Pref[] = [
  { key: "announcements", title: "Annonces de la prépa", description: "Annonces générales et nouveautés", icon: Bell, defaultOn: true },
  { key: "errors", title: "Erreurs critiques", description: "Alerte quand une erreur dépasse 3 occurrences", icon: BookX, defaultOn: true },
  { key: "schedule", title: "Rappels de planning", description: "Rappels avant vos sessions de révision", icon: Calendar, defaultOn: true },
  { key: "email", title: "Résumé hebdomadaire par email", description: "Bilan de la semaine envoyé chaque dimanche", icon: Mail, defaultOn: false },
];

const STORAGE_KEY = "notif-prefs-v1";

function loadPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const init: Record<string, boolean> = {};
  PREFS.forEach((p) => { init[p.key] = p.defaultOn; });
  return init;
}

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(loadPrefs);

  const toggle = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choisissez les alertes que vous souhaitez recevoir.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {PREFS.map((p) => (
          <div key={p.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                <p.icon className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor={p.key} className="cursor-pointer text-sm font-semibold">{p.title}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </div>
            </div>
            <Switch id={p.key} checked={prefs[p.key]} onCheckedChange={() => toggle(p.key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
