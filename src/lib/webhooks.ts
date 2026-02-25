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

export async function callWebhook(
  url: string,
  body: Record<string, unknown>
): Promise<any> {
  console.log("[webhook] Calling:", url, "with body:", JSON.stringify(body));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Webhook error ${res.status}`);
  try {
    return await res.json();
  } catch {
    return null;
  }
}
