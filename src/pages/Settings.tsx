import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Shield, Bell, Gift, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { ReferralTab } from "@/components/settings/ReferralTab";
import { BillingTab } from "@/components/settings/BillingTab";

const TABS = [
  { value: "profile", label: "Profil", icon: User },
  { value: "security", label: "Sécurité", icon: Shield },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "referral", label: "Parrainage", icon: Gift },
  { value: "billing", label: "Facturation", icon: CreditCard },
] as const;

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setSearchParams({ tab }, { replace: true });
  }, [tab, setSearchParams]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Réglages</h1>
            <p className="text-sm text-muted-foreground">Gérer votre compte, vos préférences et votre facturation</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2 data-[state=active]:bg-background">
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-6"><ProfileTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
        <TabsContent value="notifications" className="mt-6"><NotificationsTab /></TabsContent>
        <TabsContent value="referral" className="mt-6"><ReferralTab /></TabsContent>
        <TabsContent value="billing" className="mt-6"><BillingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
