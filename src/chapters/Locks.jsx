import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { C_LIMIT, C_LOCKS } from "../core/content.js";
import { Big, Guide, Icon, Progress, burst } from "../components/ui.jsx";
import { sfx } from "../sound.js";

const GEM = ["#FF9AC0", "#FFC93C", "#7BE495", "#7FD8FF", "#C7A6FF", "#FFB27A"];
const SHUFFLE = [3, 0, 5, 1, 4, 2];

function Chest({ open }) {
  return (
    <svg width="150" height="120" viewBox="0 0 150 120" aria-hidden="true" style={{ overflow: "visible" }}>
      <ellipse cx="75" cy="114" rx="62" ry="6" fill="rgba(27,19,64,.18)" />
      <rect x="18" y="52" width="114" height="58" rx="8" fill="#FF7A2F" stroke="#1B1340" strokeWidth="4" />
      <rect x="18" y="72" width="114" height="10" fill="#FFC93C" stroke="#1B1340" strokeWidth="3" />
      {open && <g>{[0, 1, 2, 3, 4].map(k => <circle key={k} cx={40 + k * 17} cy={54 - (k % 2) * 6} r="9" fill="#FFC93C" stroke="#1B1340" strokeWidth="3" />)}</g>}
      <motion.g style={{ originX: "18px", originY: "52px" }} animate={{ rotate: open ? -38 : 0, y: open ? -6 : 0 }} transition={{ type: "spring", stiffness: 180, damping: 10 }}>
        <path d="M18 52 Q18 18 75 18 Q132 18 132 52 Z" fill="#FF3D7F" stroke="#1B1340" strokeWidth="4" />
        <path d="M66 18 V52 M84 18 V52" stroke="#FFC93C" strokeWidth="6" />
      </motion.g>
      <rect x="63" y="58" width="24" height="26" rx="5" fill={open ? "#7BE495" : "#FFF4DC"} stroke="#1B1340" strokeWidth="4" />
      <circle cx="75" cy="69" r="4" fill="#1B1340" />
    </svg>
  );
}

export default function Locks({ onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState([]);
  const [order, setOrder] = useState([0, 1, 2, 3, 4, 5]);
  const [fb, setFb] = useState({ t: "", k: "" });
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(0);
  const [left, setLeft] = useState(C_LIMIT);
  const cur = useRef(null);
  const results = useRef([]);
  const busy = useRef(false);
  const lock = C_LOCKS[i];

  const finish = useCallback(outcome => {
    const c = cur.current; if (!c || c.done) return;
    c.done = true;
    const seconds = Math.min(C_LIMIT, (performance.now() - c.t0) / 1000);
    results.current.push({ n: c.n, seconds: Math.round(seconds * 10) / 10, guesses: c.guesses, guessList: c.list, shuffles: c.shuffles, outcome, at: new Date().toISOString() });
    const go = () => {
      if (i < C_LOCKS.length - 1) { setI(i + 1); } else onDone(results.current);
    };
    if (outcome === "solved") setTimeout(go, 1500); else { sfx.whoosh(); go(); }
  }, [i, onDone]);

  useEffect(() => {
    cur.current = { n: lock.n, t0: performance.now(), guesses: 0, list: [], shuffles: 0, done: false };
    busy.current = false; setPicked([]); setOrder([0, 1, 2, 3, 4, 5]); setFb({ t: "", k: "" }); setOpen(false); setLeft(C_LIMIT);
    const id = setInterval(() => {
      const c = cur.current; if (!c || c.done) return;
      const l = Math.max(0, C_LIMIT - (performance.now() - c.t0) / 1000);
      setLeft(l);
      if (l <= 0) { setFb({ t: "Time's up for this chest.", k: "bad" }); finish("timeout"); }
    }, 250);
    return () => clearInterval(id);
  }, [i]); // eslint-disable-line

  const submit = p => {
    const c = cur.current; const g = p.map(ix => lock.letters[ix]).join("");
    c.guesses++; c.list.push(g);
    if (lock.solvable && g === lock.answer) {
      setOpen(true); setFb({ t: `${g}! The chest is open.`, k: "good" }); sfx.success(); burst({ colors: ["#FFC93C", "#FFD23F", "#FF7A2F"], shapes: ["circle"] }); finish("solved");
    } else {
      sfx.thunk(); setShake(x => x + 1); setFb({ t: `${g} doesn't fit. Try again or leave this chest.`, k: "bad" });
      setTimeout(() => { setPicked([]); busy.current = false; }, 380);
    }
  };
  const pick = ix => {
    if (busy.current || cur.current?.done || picked.includes(ix) || picked.length >= 6) return;
    sfx.slide(1 + (picked.length % 5));
    const p = [...picked, ix]; setPicked(p); setFb({ t: "", k: "" });
    if (p.length === 6) { busy.current = true; setTimeout(() => submit(p), 260); }
  };
  const del = () => { if (!busy.current) { setPicked(p => p.slice(0, -1)); sfx.tap(); } };
  const clear = () => { if (!busy.current) { setPicked([]); sfx.tap(); } };
  const shuffle = () => { if (!busy.current) { setOrder(o => SHUFFLE.map(k => o[k])); cur.current.shuffles++; sfx.whoosh(); } };

  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") { e.preventDefault(); del(); return; }
      if (e.key === "Escape") { clear(); return; }
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) { const ix = order.find(x => lock.letters[x] === k && !picked.includes(x)); if (ix != null) pick(ix); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="page">
      <Progress i={i} n={C_LOCKS.length} label="Chest" color="#22D3A6" />
      {i === 0 && <Guide size={84} text="Tap the gems in order to spell a six-letter word. Typing works too. The chest checks your word as soon as all six slots are full." />}
      <AnimatePresence mode="wait">
        <motion.div key={lock.n} className="card cave" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0, y: 40 }}>
          <span className="mono">CHEST {lock.n} OF 8</span>
          <motion.div animate={open ? { y: [0, -14, 0] } : {}}><Chest open={open} /></motion.div>
          <div key={shake} className={"slots " + (shake ? "shake" : "")} aria-label="Your word so far">
            {Array.from({ length: 6 }, (_, k) => (
              <motion.div key={k} className={"slot " + (picked[k] != null ? "full" : "")} animate={picked[k] != null ? { scale: [1.3, 1] } : {}}>
                {picked[k] != null ? lock.letters[picked[k]] : ""}
              </motion.div>
            ))}
          </div>
          <div className="gems" role="group" aria-label="Letter gems">
            {order.map((ix, k) => (
              <motion.span key={ix} className="gem-wrap" layout animate={{ y: [0, -5, 0] }} style={{ display: "inline-block" }}
                transition={{ y: { duration: 1.6 + k * 0.17, repeat: Infinity }, layout: { type: "spring", stiffness: 400, damping: 25 } }}>
                <motion.button type="button" className="gem" style={{ "--gc": GEM[ix] }} disabled={picked.includes(ix)} onClick={() => pick(ix)}
                  whileTap={{ scale: 0.8 }} whileHover={{ scale: 1.08 }} aria-label={"Letter " + lock.letters[ix]}>
                  {lock.letters[ix]}
                </motion.button>
              </motion.span>
            ))}
          </div>
          <div className="row" style={{ justifyContent: "center" }}>
            <button type="button" className="pill" onClick={del}><Icon name="delete" size={18} /> Delete</button>
            <button type="button" className="pill" onClick={clear}>Clear</button>
            <button type="button" className="pill" onClick={shuffle}><Icon name="shuffle" size={18} /> Shuffle</button>
          </div>
          <div className={"fb " + fb.k} role="status">{fb.t}</div>
          <div className="fuse" aria-label={`${Math.ceil(left)} seconds left`}><i style={{ width: (left / C_LIMIT * 100) + "%" }} /></div>
          <span className="mono">{Math.ceil(left)} s · guesses {cur.current?.guesses ?? 0}</span>
        </motion.div>
      </AnimatePresence>
      <div className="row" style={{ justifyContent: "center" }}>
        <Big color="white" onClick={() => finish("skipped")} icon="footprints">Leave this chest</Big>
      </div>
    </div>
  );
}

export function LocksDebrief({ results, onGo }) {
  return (
    <div className="page">
      <Guide mood="cheer" text="Confession time: chests 3, 5 and 7 had no answer! No English word uses all six of their letters; we checked a 234,000-word dictionary. I was watching how long and how actively you kept trying. Leaving an impossible chest can be smart too, so this describes a habit, not a grade." />
      <div className="card">
        <div className="tablewrap"><table>
          <thead><tr><th>Chest</th><th>Letters</th><th>Answer</th><th>What happened</th><th>Time</th><th>Guesses</th></tr></thead>
          <tbody>{results.map(r => { const l = C_LOCKS.find(x => x.n === r.n); return (
            <tr key={r.n}><td className="n">{r.n}</td><td className="n">{l.letters}</td><td>{l.solvable ? l.answer : <b>No answer</b>}</td><td>{r.outcome}</td><td className="n">{r.seconds} s</td><td className="n">{r.guesses}</td></tr>); })}</tbody>
        </table></div>
      </div>
      <div><Big color="sun" onClick={onGo} icon="arrow-right">On to Mirror Lake</Big></div>
    </div>
  );
}
