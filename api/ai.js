// POST /api/ai — forwards a chat request to an OpenAI-compatible API.
// The key comes from the OPENAI_API_KEY environment variable, or from the
// student's own key in the "x-user-key" header when no server key is set.
// AI output is used only for reflection prompts; it never affects scoring.

const BASE_URL = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const ALLOWED_MODELS = (process.env.AI_ALLOWED_MODELS || "gpt-4o-mini,gpt-4o,gpt-4.1-mini")
  .split(",").map(s => s.trim()).filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const key = process.env.OPENAI_API_KEY || req.headers["x-user-key"];
  if (!key) return res.status(400).json({ error: "No API key. Set OPENAI_API_KEY on the server or add a key in AI mode." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const model = ALLOWED_MODELS.includes(body.model) ? body.model : ALLOWED_MODELS[0];
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  if (!messages.length) return res.status(400).json({ error: "No messages." });
  for (const m of messages) {
    if (!["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 8000) {
      return res.status(400).json({ error: "Malformed message." });
    }
  }

  try {
    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 400 })
    });
    const text = await r.text();
    res.status(r.status).setHeader("Content-Type", "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the AI provider." });
  }
}
