import React, { useState } from "react";
import { TRAITS, TRAIT_INFO } from "./core/content.js";
import { Big, Icon, Toucan } from "./components/ui.jsx";

export const AI_SYSTEM = `You are a reflection coach for a university student exploring careers. You receive their profile from a prototype that scored it with fixed rules. Rules: Never change, dispute or add scores or labels. Never tell them which career to choose. Ask at most three short, open questions that help them test the results against their real experience. When asked for an experiment, suggest one small, concrete, low-cost action they can do within two weeks. Treat "conflicting" results as open questions. Use plain, warm English, under 150 words.`;

function summary(sess) {
  const P = sess.profile;
  return JSON.stringify({
    interestCode: P.interest.combinedCode, interestAgreement: P.interest.label,
    traits: Object.fromEntries(TRAITS.map(t => [TRAIT_INFO[t].plain, { score: P.traits[t].avg, agreement: P.traits[t].label }])),
    persistence: { score: P.persistence.avg, agreement: P.persistence.label },
    studentReactions: sess.reactions, studentNotes: sess.notes, stage: sess.setup.stage
  });
}

export async function aiCall(sess, ai, setAi, kind, userText = "") {
  const prompts = { questions: "Ask me up to three reflection questions about my profile.", experiment: "Suggest one small experiment I can try in the next two weeks to test my top interest.", chat: userText };
  const history = ai.log.flatMap(l => [{ role: "user", content: l.prompt }, { role: "assistant", content: l.reply }]).slice(-8);
  const messages = [{ role: "system", content: AI_SYSTEM }, { role: "user", content: "My profile: " + summary(sess) }, ...history, { role: "user", content: prompts[kind] }];
  setAi(a => ({ ...a, busy: true, error: "" }));
  try {
    let res;
    if (ai.server) res = await fetch("api/ai", { method: "POST", headers: { "Content-Type": "application/json", ...(ai.key ? { "x-user-key": ai.key } : {}) }, body: JSON.stringify({ model: ai.model, messages }) });
    else {
      if (!ai.key) throw new Error("Add an API key in AI mode settings first.");
      res = await fetch(ai.baseUrl.replace(/\/$/, "") + "/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + ai.key }, body: JSON.stringify({ model: ai.model, messages, temperature: 0.7, max_tokens: 400 }) });
    }
    if (!res.ok) { const t = await res.text(); throw new Error(`The AI provider returned ${res.status}. ${t.slice(0, 160)}`); }
    const j = await res.json();
    const reply = j.choices?.[0]?.message?.content?.trim() || "(empty reply)";
    setAi(a => ({ ...a, busy: false, log: [...a.log, { at: new Date().toISOString(), kind, model: a.model, prompt: prompts[kind], user: kind === "chat" ? userText : "", reply }] }));
  } catch (e) {
    const msg = /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "Couldn't reach the AI provider from this page. Previews block outside connections; the Vercel version sends AI calls through its own server." : e.message;
    setAi(a => ({ ...a, busy: false, error: msg }));
  }
}

export function Coach({ sess, ai, setAi }) {
  const [text, setText] = useState("");
  if (!ai.enabled) return <p className="note">Turn on <b>AI mode</b> (top right) to chat with a reflection coach about this map. It asks questions and never changes a score.</p>;
  return (
    <div className="card coach">
      <div className="row" style={{ justifyContent: "space-between" }}><div className="row"><Toucan size={56} /><b style={{ fontSize: "1.2rem" }}>Kiko's reflection corner</b></div><span className="label mixed">AI-generated, not scored</span></div>
      {ai.log.map((l, k) => (
        <React.Fragment key={k}>
          {l.user && <div className="msg me"><span className="who">You</span>{l.user}</div>}
          <div className="msg ai"><span className="who">AI-generated · {l.model}</span>{l.reply}</div>
        </React.Fragment>
      ))}
      {!ai.log.length && <p className="small">The coach sees your scores, labels and stamps, not your name.</p>}
      {ai.error && <p className="small" style={{ color: "var(--bad)", fontWeight: 600 }}>{ai.error}</p>}
      <div className="row">
        <Big className="small" color="mint" disabled={ai.busy} onClick={() => aiCall(sess, ai, setAi, "questions")} icon="sparkles">Ask me questions</Big>
        <Big className="small" color="white" disabled={ai.busy} onClick={() => aiCall(sess, ai, setAi, "experiment")} icon="flag">Suggest one experiment</Big>
      </div>
      <form className="row" onSubmit={e => { e.preventDefault(); if (text.trim()) { aiCall(sess, ai, setAi, "chat", text.trim()); setText(""); } }}>
        <input aria-label="Message to the coach" value={text} onChange={e => setText(e.target.value)} placeholder="Reply or ask about your map" style={{ flex: 1, minWidth: 180, font: "inherit", border: "var(--edge)", borderRadius: 14, padding: "10px 14px" }} />
        <Big type="submit" className="small" disabled={ai.busy}>Send</Big>
      </form>
      {ai.busy && <p className="small">Kiko is thinking…</p>}
    </div>
  );
}

export function AiSettings({ ai, setAi, onClose }) {
  const [d, setD] = useState({ enabled: ai.enabled, key: ai.key, model: ai.model, baseUrl: ai.baseUrl });
  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="aiT">
        <div className="row" style={{ justifyContent: "space-between" }}><h3 id="aiT" style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: "1.6rem" }}>AI mode</h3>
          <button type="button" className="round" onClick={onClose} aria-label="Close"><Icon name="x" size={20} /></button></div>
        <label className="switch">Use AI for reflection prompts<input type="checkbox" checked={d.enabled} onChange={e => setD({ ...d, enabled: e.target.checked })} /></label>
        <p className="small">AI never changes scores, labels or statements. It only adds a reflection coach on your map, and every message is marked AI-generated.</p>
        <p className="small"><b>Connection:</b> {ai.server ? `this site's server (/api/ai)${ai.serverKey ? " with a server-side key. A key below is optional." : ". Add your key below."}` : "direct from your browser to the provider."}</p>
        <label className="field">API key <input type="password" value={d.key} onChange={e => setD({ ...d, key: e.target.value })} placeholder="sk-…" autoComplete="off" /><small>Kept in memory only. Lost on reload, never exported.</small></label>
        <label className="field">Model <input value={d.model} onChange={e => setD({ ...d, model: e.target.value })} /></label>
        {!ai.server && <label className="field">Base URL (OpenAI-compatible) <input value={d.baseUrl} onChange={e => setD({ ...d, baseUrl: e.target.value })} /></label>}
        <div><Big color="mint" onClick={() => { setAi(a => ({ ...a, ...d, model: d.model || "gpt-4o-mini", error: "" })); onClose(); }} icon="check">Save</Big></div>
      </div>
    </div>
  );
}
