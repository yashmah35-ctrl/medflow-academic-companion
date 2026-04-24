// Plans d'abonnement Stripe (Live)
export type PlanId = "monthly" | "quarterly" | "yearly";

export interface PlanInfo {
  id: PlanId;
  name: string;
  priceId: string;
  amountCents: number;
  interval: "month" | "quarter" | "year";
  intervalLabel: string;
  monthlyEquivalent: string;
  credits: string;
  badge?: string;
  highlight?: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  monthly: {
    id: "monthly",
    name: "Mensuel",
    priceId: "price_1TDPri19EBNXe60DCN8FSQ4h", // mensuel 10€/mois
    amountCents: 1000,
    interval: "month",
    intervalLabel: "/mois",
    monthlyEquivalent: "10 €/mois",
    credits: "4 000 crédits/mois",
  },
  quarterly: {
    id: "quarterly",
    name: "Trimestriel",
    priceId: "price_1TNgUs19EBNXe60DgdZksSXK",
    amountCents: 2800,
    interval: "quarter",
    intervalLabel: "/3 mois",
    monthlyEquivalent: "≈ 9,33 €/mois",
    credits: "15 000 crédits (en une fois)",
    badge: "−2 € vs mensuel",
  },
  yearly: {
    id: "yearly",
    name: "Annuel",
    priceId: "price_1TNgVk19EBNXe60DBTCTyV4m",
    amountCents: 9900,
    interval: "year",
    intervalLabel: "/an",
    monthlyEquivalent: "≈ 8,25 €/mois",
    credits: "Crédits illimités",
    badge: "Meilleure offre",
    highlight: true,
  },
};

export const PRICE_TO_PLAN: Record<string, PlanId> = {
  [PLANS.monthly.priceId]: "monthly",
  [PLANS.quarterly.priceId]: "quarterly",
  [PLANS.yearly.priceId]: "yearly",
};
