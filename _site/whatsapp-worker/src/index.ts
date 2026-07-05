export interface Env {
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
}

// Keyword -> reply. First matching keyword found in the (lowercased) inbound
// message wins; order matters when a message could match more than one.
const KEYWORD_REPLIES: Array<[string, string]> = [
  ["horario", "Atendemos de lunes a viernes, 9am a 6pm (hora Perú)."],
  ["ubicaci", "Estamos en Lima, Perú. Más detalles en https://aguasanperu.org/#contact"],
  ["donar", "¡Gracias por tu interés en donar! Escríbenos a contacto@aguasanperu.org y te enviamos los detalles."],
  ["proyecto", "Puedes ver nuestros proyectos en https://aguasanperu.org/#portfolio"],
  ["contacto", "Puedes escribirnos aquí o al correo contacto@aguasanperu.org"],
];

const FALLBACK_REPLY =
  "¡Gracias por escribirnos! Un miembro del equipo de AguaSan te responderá pronto.";

function pickReply(messageText: string): string {
  const lower = messageText.toLowerCase();
  for (const [keyword, reply] of KEYWORD_REPLIES) {
    if (lower.includes(keyword)) return reply;
  }
  return FALLBACK_REPLY;
}

async function sendWhatsAppMessage(env: Env, to: string, body: string): Promise<void> {
  await fetch(
    `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body },
      }),
    }
  );
}

function handleVerify(url: URL, env: Env): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

async function handleInbound(request: Request, env: Env): Promise<Response> {
  const payload = (await request.json()) as any;

  const messages =
    payload?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];

  for (const message of messages) {
    const from = message?.from;
    const text = message?.text?.body;
    if (!from || !text) continue;
    await sendWhatsAppMessage(env, from, pickReply(text));
  }

  // Meta requires a 200 response regardless of content to avoid retries.
  return new Response("OK", { status: 200 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/api/whatsapp/webhook") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      return handleVerify(url, env);
    }

    if (request.method === "POST") {
      return handleInbound(request, env);
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
