// GET /api/health — tells the app that AI calls can go through this server.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, serverKey: Boolean(process.env.OPENAI_API_KEY) });
}
