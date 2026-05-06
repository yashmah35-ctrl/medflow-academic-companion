import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Users, DollarSign, CheckCircle2, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Affiliate {
  id: string;
  code: string;
  influencer_name: string;
  influencer_email: string | null;
  discount_amount: number;
  commission_per_subscriber: number;
  total_subscribers: number;
  total_commission_earned: number;
  is_active: boolean;
  affiliate_type: string;
  created_at: string;
}

interface AffiliateSub {
  id: string;
  affiliate_code: string;
  subscriber_email: string | null;
  subscribed_at: string;
  commission_amount: number;
  is_paid: boolean;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [subs, setSubs] = useState<AffiliateSub[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);

  useEffect(() => { fetchAffiliates(); }, []);

  const fetchAffiliates = async () => {
    const { data, error } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false }) as { data: Affiliate[] | null; error: any };
    if (error) {
      console.error("Fetch affiliates error:", error);
      toast.error(`Lecture impossible: ${error.message}`);
      return;
    }
    if (data) setAffiliates(data);
  };

  const fetchSubs = async (affiliateCode: string) => {
    setSelectedAffiliate(affiliateCode);
    const { data } = await supabase
      .from("affiliate_subscriptions")
      .select("*")
      .eq("affiliate_code", affiliateCode)
      .order("subscribed_at", { ascending: false }) as { data: AffiliateSub[] | null };
    if (data) setSubs(data);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("affiliates").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    fetchAffiliates();
  };

  const togglePaid = async (subId: string, current: boolean) => {
    await supabase.from("affiliate_subscriptions").update({ is_paid: !current }).eq("id", subId);
    if (selectedAffiliate) fetchSubs(selectedAffiliate);
  };

  const deleteAffiliate = async (id: string) => {
    if (!confirm("Supprimer cet affilié et toutes ses données ?")) return;
    const { error } = await supabase.from("affiliates").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Affilié supprimé");
    fetchAffiliates();
    if (selectedAffiliate) { setSelectedAffiliate(null); setSubs([]); }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Gestion Affiliés</h2>
            <p className="text-sm text-muted-foreground">Codes promo, commissions et statistiques</p>
          </div>
        </div>
      </motion.div>

      {/* Affiliates Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="text-center">Réduction</TableHead>
              <TableHead className="text-center">Commission</TableHead>
              <TableHead className="text-center">Abonnés</TableHead>
              <TableHead className="text-center">Total gagné</TableHead>
              <TableHead className="text-center">Actif</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun code</TableCell></TableRow>
            )}
            {affiliates.map(a => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => fetchSubs(a.code)}>
                <TableCell>
                  <Badge variant="outline" className="font-mono font-bold">{a.code}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{a.influencer_name}</div>
                  {a.influencer_email && <div className="text-xs text-muted-foreground">{a.influencer_email}</div>}
                </TableCell>
                <TableCell className="text-center">{a.discount_amount}€</TableCell>
                <TableCell className="text-center">{a.commission_per_subscriber}€</TableCell>
                <TableCell className="text-center font-semibold">{a.total_subscribers}</TableCell>
                <TableCell className="text-center font-semibold text-emerald-500">{a.total_commission_earned}€</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); toggleActive(a.id, a.is_active); }}>
                    {a.is_active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={e => { e.stopPropagation(); deleteAffiliate(a.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Subscriber details */}
      {selectedAffiliate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Abonnés via <Badge variant="outline" className="font-mono">{selectedAffiliate}</Badge>
          </h3>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun abonné avec ce code</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Commission</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.subscriber_email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(s.subscribed_at)}</TableCell>
                    <TableCell className="text-center font-semibold">{s.commission_amount}€</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => togglePaid(s.id, s.is_paid)}>
                        {s.is_paid ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Payé
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" /> En attente
                          </Badge>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>
      )}
    </div>
  );
}
