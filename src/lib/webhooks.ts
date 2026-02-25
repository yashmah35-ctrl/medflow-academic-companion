const N8N_BASE = "https://n8n.srv1366613.hstgr.cloud/webhook/medflow";

export const WEBHOOKS = {
  ENT: `${N8N_BASE}/ent-connexion`,
  FLASHCARDS: `${N8N_BASE}/generate-flashcards`,
  SCHEDULE: `${N8N_BASE}/schedule-generator`,
  OCR: `${N8N_BASE}/ocr-analyzer`,
  ACTIVE_LEARNING: `${N8N_BASE}/active-learning`,
  ANNALES: `${N8N_BASE}/annales-analyzer`,
  NOTIFICATIONS: `${N8N_BASE}/notifications`,
} as const;

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-proxy`;

export async function callWebhook(
  url: string,
  body: Record<string, unknown>
): Promise<any> {
  console.log("[webhook] Proxying:", url, "with body:", JSON.stringify(body));
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ webhook_url: url, payload: body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Webhook proxy error ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}
