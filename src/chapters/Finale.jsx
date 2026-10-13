import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ACC_SCALE, B_SCENES, C_LOCKS, FIELDS, INTEREST_ITEMS, LIKE_SCALE, MINI_IPIP, PERSIST_ITEMS, REFS, SENTENCES, TRAITS, TRAIT_INFO, TYPES, TYPE_INFO, VERSION, r1 } from "../core/content.js";
import { Big, Guide, Icon, Pill, burst } from "../components/ui.jsx";
import { sfx } from "../sound.js";
import { AI_SYSTEM, Coach } from "../ai.jsx";

const tc = t => `var(--t-${t.toLowerCase()})`;
const MIXED = "Your play and your answers lean the same way, but not strongly.";
export function traitStatement(tr, t) {
  return t.label === "conflicting" ? `Your choices in the story and your answers point in different directions for ${TRAIT_INFO[tr].plain.toLowerCase()}. Which feels more like you?` : t.sentence;
}
export function interestStatement(I) {
  const code = I.combinedCode;
  return I.label === "conflicting"
    ? `Your market choices pointed to ${I.game.code.split("").map(t => TYPE_INFO[t].name).join(", ")} work, but your job-fair ratings pointed to ${I.self.code.split("").map(t => TYPE_INFO[t].name).join(", ")}. Which feels closer?`
    : `Your strongest pull is toward ${TYPE_INFO[code[0]].name.toLowerCase()} work: ${TYPE_INFO[code[0]].desc}, followed by ${TYPE_INFO[code[1]].name.toLowerCase()} work.`;
}
const persistStatement = P => P.persistence.label === "conflicting" ? "How long you kept trying on the chests and how you describe yourself point different ways. Which feels more like you?" : P.persistence.sentence;

function Bar({ label, game, self, color, delay = 0 }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <div className="track" role="img" aria-label={`${label}: game ${game}, self-report ${self}`}>
        <motion.div className="fill" style={{ background: color }} initial={{ width: 0 }} animate={{ width: game + "%" }} transition={{ delay, type: "spring", stiffness: 60, damping: 14 }} />
        <motion.span className="tick" style={{ left: self + "%" }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: delay + 0.4 }} />
      </div>
      <span className="mono">{game} · {self}</span>
    </div>
  );
}

function Postcard({ id, kick, label, text, sub, sess, react, note, onHow, i = 0 }) {
  const r = sess.reactions[id];
  const opts = label === "conflicting" ? [["game", "Play is closer"], ["self", "Answers are closer"], ["neither", "Neither"]] : [["yes", "That's me!"], ["partly", "Sort of"], ["no", "Nope"]];
  return (
    <motion.div className="postcard" initial={{ y: 40, opacity: 0, rotate: i % 2 ? 2 : -2 }} animate={{ y: 0, opacity: 1, rotate: i % 2 ? 0.6 : -0.6 }} transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.4 + i * 0.08 }}>
      <div className="top2"><span className="kick">{kick}</span><span className={"label " + label}>{label}</span></div>
      <p className="say">{text}</p>
      {sub && <p className="sub">{sub}</p>}
      <div className="stampbtns" role="group" aria-label="Does this fit you?">
        {opts.map(([v, l]) => (
          <motion.button type="button" key={v} className={`sbtn ${v} ${r === v ? "on" : ""}`} aria-pressed={r === v}
            onClick={() => { sfx.stamp(); react(id, v); }} whileTap={{ scale: 1.25, rotate: 0 }} animate={r === v ? { scale: [1.4, 1] } : {}}>{l}</motion.button>
        ))}
      </div>
      <textarea aria-label="Your note" placeholder="Optional: why does it fit or not?" defaultValue={sess.notes[id] || ""} onChange={e => note(id, e.target.value)} />
      <button type="button" className="how" onClick={() => onHow(id)}>How was this worked out?</button>
    </motion.div>
  );
}

export function Finale({ sess, react, note, ai, setAi, onRestart, onDownload, tab, setTab }) {
  const P = sess.profile;
  const [openEv, setOpenEv] = useState(null);
  useEffect(() => { if (tab === "map") { const t = setTimeout(() => burst({ particleCount: 140, spread: 100 }), 500); return () => clearTimeout(t); } }, []); // eslint-disable-line
  if (!P) return null;
  const I = P.interest, code = I.combinedCode;
  const how = id => { setOpenEv(id); setTab("evidence"); setTimeout(() => document.getElementById("ev-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); };
  const nick = sess.setup.nickname ? `${sess.setup.nickname}'s` : "Your";
  return (
    <div className="page">
      {sess.example && <div className="banner">Example map: made-up answers to show what the prototype produces. Not a real person.</div>}
      <span className="kicker">Your island map · prototype {VERSION}</span>
      <h1 className="h2" style={{ fontSize: "clamp(2.2rem,7vw,4rem)" }}>{nick} Island of Ikigai</h1>
      <div className="tabs">
        <Pill active={tab === "map"} ariaPressed={tab === "map"} onClick={() => setTab("map")}><Icon name="map" size={18} /> Island map</Pill>
        <Pill active={tab === "evidence"} ariaPressed={tab === "evidence"} onClick={() => setTab("evidence")}><Icon name="file-text" size={18} /> Evidence report</Pill>
      </div>
      {tab === "map" ? (
        <>
          <Guide mood="cheer" text="Ta-da! Here's what your play suggests. Every result comes from fixed rules, and you get the final say: stamp each postcard." />
          <div className="card cream" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span className="kick">Your three work-interest flags</span>
            <div className="flags">
              {code.split("").map((t, k) => (
                <motion.div key={t} className="flag" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + k * 0.25, type: "spring", stiffness: 200, damping: 12 }}
                  onAnimationStart={() => setTimeout(() => sfx.pop(), 300 + k * 250)}>
                  <motion.div className="cloth" style={{ background: tc(t) }} animate={{ skewY: [0, -4, 0, 3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: k * 0.4 }}>
                    <b>{t}</b><small>{TYPE_INFO[t].short}</small>
                  </motion.div>
                  <div className="pole" style={{ height: 70 - k * 18 }} />
                </motion.div>
              ))}
            </div>
            <p className="small" style={{ textAlign: "center" }}>Combined from the market and the job fair. Scores compare your own interests with each other, not with other people.</p>
            <div className="bars">{TYPES.map((t, k) => <Bar key={t} label={TYPE_INFO[t].name} game={I.game.score[t]} self={I.self.score[t]} color={tc(t)} delay={0.8 + k * 0.1} />)}</div>
            <div className="legend"><span><i className="sw" /> Market (game)</span><span><i className="sw t" /> Job fair (your ratings)</span><span className="mono">numbers: game · ratings, 0–100</span></div>
          </div>
          <div className="postcards">
            <Postcard id="interest" kick="Work interests" label={I.label} text={interestStatement(I)} sub={I.label === "mixed" ? MIXED : ""} sess={sess} react={react} note={note} onHow={how} />
            <motion.div className="postcard" style={{ background: "#FFF4DC" }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <span className="kick">Places worth exploring</span>
              <div className="fields">{code.slice(0, 2).split("").map(t => (
                <div key={t}><b style={{ color: tc(t) }}>{TYPE_INFO[t].name}</b><ul>{FIELDS[t].map(f => <li key={f}>{f}</li>)}</ul></div>))}</div>
              <p className="sub">Broad fields linked to your top two interest types. Places to look, not recommendations.</p>
            </motion.div>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="kick">How you tend to work</span>
            <div className="bars">{TRAITS.map((tr, k) => <Bar key={tr} label={TRAIT_INFO[tr].plain} game={P.traits[tr].game.score} self={P.traits[tr].self.score} color="var(--grape)" delay={0.2 + k * 0.1} />)}</div>
            <div className="legend"><span><i className="sw" /> Story Paths (game)</span><span><i className="sw t" /> Mirror Lake (your cards)</span></div>
          </div>
          <div className="postcards">
            {TRAITS.map((tr, k) => <Postcard key={tr} i={k} id={tr} kick={TRAIT_INFO[tr].plain} label={P.traits[tr].label} text={traitStatement(tr, P.traits[tr])} sub={P.traits[tr].label === "mixed" ? MIXED : ""} sess={sess} react={react} note={note} onHow={how} />)}
            <Postcard id="P" i={5} kick="Hard problems" label={P.persistence.label} text={persistStatement(P)} sub={`You opened ${P.persistence.game.solved} of 5 openable chests. Leaving impossible tasks can be a good strategy; this describes a habit, not a grade.`} sess={sess} react={react} note={note} onHow={how} />
          </div>
          <Coach sess={sess} ai={ai} setAi={setAi} />
          <div className="row">
            <Big color="sun" onClick={() => setTab("evidence")} icon="file-text">Open the evidence report</Big>
            <Big color="white" onClick={onRestart} icon="sailboat">Play again</Big>
          </div>
        </>
      ) : <Evidence sess={sess} ai={ai} openEv={openEv} onDownload={onDownload} />}
    </div>
  );
}

function RefLink({ k }) { const r = REFS[k]; return <a href={r.url} target="_blank" rel="noopener noreferrer">{r.label}</a>; }

function EvBlock({ id, title, label, statement, children, rule, basis, sess, open }) {
  const r = sess.reactions[id], n = sess.notes[id];
  return (
    <details id={"ev-" + id} open={open}>
      <summary><span>{title}</span><span className={"label " + label}>{label}</span></summary>
      <dl>
        <dt>Statement</dt><dd>{statement}</dd>
        <dt>Evidence</dt><dd>{children}</dd>
        <dt>Rule</dt><dd><div className="calc">{rule}</div></dd>
        <dt>Basis</dt><dd>{basis}</dd>
        <dt>Student</dt><dd>{r || <span style={{ opacity: .6 }}>no reaction yet</span>}{n ? ` · “${n}”` : ""}</dd>
      </dl>
    </details>
  );
}

export function exportData(sess, ai) {
  return { app: "Island of Ikigai prototype", version: VERSION, example: sess.example, startedAt: sess.startedAt, finishedAt: sess.finishedAt,
    setup: sess.setup, gameA: sess.A.picks, gameB: sess.B.log, gameC: sess.C.results, selfReport: sess.SR.answers, selfReportTimesMs: sess.SR.times,
    profile: sess.profile, reactions: sess.reactions, notes: sess.notes, ai: { enabled: ai.enabled, model: ai.model, systemPrompt: AI_SYSTEM, log: ai.log } };
}

export function Evidence({ sess, ai, openEv, onDownload, forFile = false }) {
  const P = sess.profile, I = P.interest, A = sess.SR.answers;
  const [msg, setMsg] = useState("");
  const sceneLine = sid => { const sc = B_SCENES.find(s => s.id === sid), lv = sess.B.levels[sid]; return `${sc.title} → “${sc.options[lv - 1]}” (level ${lv})`; };
  const itemLine = (it, scale) => `${it.text} → ${scale[A[it.id] - 1]} (${A[it.id]}${it.key === -1 ? ", reversed" : ""})`;
  const dur = sess.startedAt && sess.finishedAt ? Math.round((new Date(sess.finishedAt) - new Date(sess.startedAt)) / 60000) + " min" : "–";
  const json = JSON.stringify(exportData(sess, ai), null, 2);
  const copy = () => navigator.clipboard?.writeText(json).then(() => setMsg("Copied.")).catch(() => setMsg("Select the text in the box and copy it."));
  const open = id => forFile || openEv === id;
  const srRows = [...MINI_IPIP.map(i => [i.id, `Mini-IPIP ${i.trait}${i.key === 1 ? "+" : "−"}`, i.text, ACC_SCALE]), ...PERSIST_ITEMS.map(i => [i.id, `Persistence${i.key === 1 ? "+" : "−"}`, i.text, ACC_SCALE]), ...INTEREST_ITEMS.map(i => [i.id, "Interest " + i.type, i.text, LIKE_SCALE])];
  return (
    <div className="ev">
      <div className="card"><div className="tablewrap"><table><tbody>
        <tr><th>Version</th><td className="n">v{VERSION}</td></tr>
        <tr><th>Started</th><td className="n">{sess.startedAt || "–"}</td></tr>
        <tr><th>Finished</th><td className="n">{sess.finishedAt || "–"} ({dur})</td></tr>
        <tr><th>Consent</th><td>18+ confirmed: {sess.setup.adult ? "yes" : "no"} · agreed to take part: {sess.setup.consent ? "yes" : "no"}</td></tr>
        <tr><th>Stage / field</th><td>{sess.setup.stage} · {sess.setup.field || "not given"} (not scored)</td></tr>
        <tr><th>AI mode</th><td>{ai.enabled ? "on" : "off"} · {ai.log.length} AI messages (never used in scoring)</td></tr>
        <tr><th>Data</th><td>{sess.example ? <b>Example data, not a real person</b> : "Real session"}</td></tr>
      </tbody></table></div></div>

      <h3>Each result, traced</h3>
      <EvBlock id="interest" title="Work interests" label={I.label} statement={`Combined code ${I.combinedCode}. ${interestStatement(I)}`} rule={I.rule} sess={sess} open={open("interest")}
        basis={<><RefLink k="onet" />; <RefLink k="nye" />. Activity cards and job-fair items written for this prototype in O*NET work-activity style; not validated. Tie-break: more hearts, then order R, I, A, S, E, C.</>}>
        <b>Market of Maybes (hearts − clouds)</b>
        <div className="calc">{TYPES.map(t => `${t} ${TYPE_INFO[t].name}: ${I.game.calc[t].replace("\n", "; ")}`).join("\n")}</div>
        <b>Dream Job Fair ratings</b>
        <div className="calc">{TYPES.map(t => `${t}: ${I.self.calc[t].replace("\n", "; ")}`).join("\n")}</div>
      </EvBlock>
      {TRAITS.map(tr => { const t = P.traits[tr]; return (
        <EvBlock key={tr} id={tr} title={`${TRAIT_INFO[tr].plain} (${TRAIT_INFO[tr].name})`} label={t.label} statement={traitStatement(tr, t)} rule={t.rule} sess={sess} open={open(tr)}
          basis={<><RefLink k="miniipip" /> (public-domain IPIP items, played as cards). Story scenes written for this prototype. <RefLink k="dang" />.</>}>
          <b>Story Paths</b><ul>{t.game.scenes.map(s => <li key={s}>{sceneLine(s)}</li>)}</ul><div className="calc">{t.game.calc}</div>
          <b>Mirror Lake cards (Mini-IPIP)</b><ul>{MINI_IPIP.filter(i => i.trait === tr).map(i => <li key={i.id}>{itemLine(i, ACC_SCALE)}</li>)}</ul><div className="calc">{t.self.calc}</div>
        </EvBlock>); })}
      <EvBlock id="P" title="Hard problems (persistence)" label={P.persistence.label} statement={persistStatement(P)} rule={P.persistence.rule} sess={sess} open={open("P")}
        basis={<><RefLink k="ventura" />; <RefLink k="palaoag" />. Persistence cards written for this prototype; not validated.</>}>
        <b>Treasure Locks (unsolvable chests only)</b><div className="calc">{P.persistence.game.calc}</div>
        <b>Persistence cards</b><ul>{PERSIST_ITEMS.map(i => <li key={i.id}>{itemLine(i, ACC_SCALE)}</li>)}</ul><div className="calc">{P.persistence.self.calc}</div>
        <p className="small">Openable chests opened: {P.persistence.game.solved} of 5 (reported, not scored). Chests flagged "waiting, not trying": {P.persistence.game.flags}.</p>
      </EvBlock>

      <h3>Raw data</h3>
      <details open={forFile}><summary>Market of Maybes · 12 rounds</summary><div className="tablewrap"><table>
        <thead><tr><th>#</th><th>Stalls (type hidden during play)</th><th>Heart</th><th>Cloud</th><th>Time</th><th>Changes</th></tr></thead>
        <tbody>{sess.A.picks.map(p => <tr key={p.round}><td className="n">{p.round}</td><td>{p.cards.map(c => <div key={c.id}><span className="tt" style={{ background: tc(c.type) }}>{c.type}</span> {c.text}</div>)}</td><td className="n">{p.most}</td><td className="n">{p.least}</td><td className="n">{p.ms != null ? (p.ms / 1000).toFixed(1) + " s" : "–"}</td><td className="n">{p.changes ?? 0}</td></tr>)}</tbody></table></div></details>
      <details open={forFile}><summary>Story Paths · 10 scenes</summary><div className="tablewrap"><table>
        <thead><tr><th>Scene</th><th>Trait</th><th>Path taken</th><th>Level</th><th>Time</th><th>Changes</th></tr></thead>
        <tbody>{sess.B.log.map(l => <tr key={l.id}><td className="n">{l.id}</td><td className="n">{l.trait}</td><td>{B_SCENES.find(s => s.id === l.id).options[l.level - 1]}</td><td className="n">{l.level}</td><td className="n">{l.ms != null ? (l.ms / 1000).toFixed(1) + " s" : "–"}</td><td className="n">{l.changes}</td></tr>)}</tbody></table></div></details>
      <details open={forFile}><summary>Treasure Locks · 8 chests</summary><div className="tablewrap"><table>
        <thead><tr><th>Chest</th><th>Letters</th><th>Type</th><th>Outcome</th><th>Time</th><th>Guesses</th><th>Shuffles</th><th>Active</th><th>Flag</th><th>Words tried</th></tr></thead>
        <tbody>{P.persistence.game.rows.map(r => <tr key={r.n}><td className="n">{r.n}</td><td className="n">{C_LOCKS.find(l => l.n === r.n).letters}</td><td>{r.solvable ? "openable" : "no answer"}</td><td>{r.outcome}</td><td className="n">{r.seconds} s</td><td className="n">{r.guesses}</td><td className="n">{r.shuffles ?? 0}</td><td className="n">{r.active != null ? r1(r.active) + " s" : "–"}</td><td>{r.flag ? "waiting" : ""}</td><td className="n">{(r.guessList || []).join(" ")}</td></tr>)}</tbody></table></div></details>
      <details open={forFile}><summary>Mirror Lake · 34 answers</summary><div className="tablewrap"><table>
        <thead><tr><th>Id</th><th>Scale</th><th>Item</th><th>Answer</th><th>Value</th><th>Time</th></tr></thead>
        <tbody>{srRows.map(([id, kind, text, sc]) => <tr key={id}><td className="n">{id}</td><td>{kind}</td><td>{text}</td><td>{sc[A[id] - 1]}</td><td className="n">{A[id]}</td><td className="n">{sess.SR.times?.[id] != null ? (sess.SR.times[id] / 1000).toFixed(1) + " s" : "–"}</td></tr>)}</tbody></table></div></details>
      {ai.log.length > 0 && <details open={forFile}><summary>AI messages (not scored)</summary><p className="small">System prompt:</p><div className="calc">{AI_SYSTEM}</div>
        <div className="tablewrap"><table><thead><tr><th>Time</th><th>Kind</th><th>Model</th><th>Reply</th></tr></thead>
          <tbody>{ai.log.map((l, k) => <tr key={k}><td className="n">{l.at.slice(11, 19)}</td><td>{l.kind}</td><td>{l.model}</td><td style={{ whiteSpace: "pre-wrap" }}>{l.reply}</td></tr>)}</tbody></table></div></details>}
      {!forFile && <details open><summary>Export</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <p className="small">The full session as JSON with every rule result, or this evidence report as a standalone web page.</p>
          <div className="row">
            <Big className="small" color="sun" onClick={copy} icon="copy">Copy JSON</Big>
            <Big className="small" color="white" onClick={() => onDownload("json", setMsg)} icon="download">Download JSON</Big>
            <Big className="small" color="white" onClick={() => onDownload("html", setMsg)} icon="download">Download evidence report</Big>
            <span className="small" role="status">{msg}</span>
          </div>
          <div className="jsonbox">{json}</div>
        </div></details>}
    </div>
  );
}
