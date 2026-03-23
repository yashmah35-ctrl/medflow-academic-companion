import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Users, DollarSign, CheckCircle2, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDiscount, setNewDiscount] = useState("2");
  const [newCommission, setNewCommission] = useState("4");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchAffiliates(); }, []);

  const fetchAffiliates = async () => {
    const { data } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false }) as { data: Affiliate[] | null };
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

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Code et nom obligatoires");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("affiliates").insert({
      code: newCode.toUpperCase().trim(),
      influencer_name: newName.trim(),
      influencer_email: newEmail.trim() || null,
      discount_amount: parseFloat(newDiscount) || 0,
      commission_per_subscriber: parseFloat(newCommission) || 0,
    });
    if (error) {
      console.error("Affiliate creation error:", error);
      toast.error(error.message.includes("duplicate") ? "Ce code existe déjà" : `Erreur: ${error.message}`);
    } else {
      toast.success(`Code ${newCode.toUpperCase()} créé !`);
      setCreateOpen(false);
      setNewCode(""); setNewName(""); setNewEmail(""); setNewDiscount("2"); setNewCommission("4");
      fetchAffiliates();
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("affiliates").update({ is_active: !current }).eq("id", id);
    fetchAffiliates();
  };

  const togglePaid = async (subId: string, current: boolean) => {
    await supabase.from("affiliate_subscriptions").update({ is_paid: !current }).eq("id", subId);
    if (selectedAffiliate) fetchSubs(selectedAffiliate);
  };

  const deleteAffiliate = async (id: string) => {
    if (!confirm("Supprimer cet affilié et toutes ses données ?")) return;
    await supabase.from("affiliates").delete().eq("id", id);
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Gestion Affiliés</h2>
              <p className="text-sm text-muted-foreground">Codes promo, commissions et statistiques</p>
            </div>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Nouveau code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un code affilié</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Code promo</Label><Input placeholder="ALEX50" value={newCode} onChange={e => setNewCode(e.target.value)} /></div>
                <div><Label>Nom influenceur</Label><Input placeholder="Alex Dupont" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div><Label>Email (optionnel)</Label><Input placeholder="alex@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Réduction (€/mois)</Label><Input type="number" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} /></div>
                  <div><Label>Commission (€/abonné)</Label><Input type="number" value={newCommission} onChange={e => setNewCommission(e.target.value)} /></div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Création..." : "Créer le code"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Affiliates Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Influenceur</TableHead>
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
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun code affilié</TableCell></TableRow>
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
