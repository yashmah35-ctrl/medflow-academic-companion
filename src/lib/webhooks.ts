const N8N_BASE = "https://n8n.srv1366613.hstgr.cloud/webhook/medflow";

export const WEBHOOKS = {
  FLASHCARDS: `${N8N_BASE}/generate-flashcards`,
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
  const proxyBody = { webhook_url: url, payload: body };
  console.log("[webhook] PROXY_URL:", PROXY_URL);
  console.log("[webhook] Target webhook:", url);
  console.log("[webhook] Request body:", JSON.stringify(proxyBody));
  console.log("[webhook] Using apikey:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.slice(0, 20) + "…");

  try {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(proxyBody),
    });

    console.log("[webhook] Response status:", res.status);
    const text = await res.text();
    console.log("[webhook] Response body:", text);

    if (!res.ok) {
      let errMsg = `Webhook proxy error ${res.status}`;
      try {
        const err = JSON.parse(text);
        errMsg = err?.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    try {
      return JSON.parse(text);
    } catch {
      return text || null;
    }
  } catch (err: any) {
    console.error("[webhook] callWebhook failed:", err);
    throw err;
  }
}
