import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { A_ROUNDS } from "../core/content.js";
import { Big, Guide, Icon, Progress, burst } from "../components/ui.jsx";
import { sfx } from "../sound.js";

// Awning colours follow the stall position, never the interest type.
const AWN = [["#FF3D7F", "#FFC93C"], ["#3D5AFE", "#00C2FF"], ["#22D3A6", "#FF7A2F"]];
const LINES = ["", "Nice. Next row of stalls!", "Fresh stalls just opened.", "Halfway through the market!", "Keep going, you're doing great.", "Last few stalls."];

export default function Market({ onDone }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState({ most: null, least: null });
  const [changes, setChanges] = useState(0);
  const [picks, setPicks] = useState([]);
  const t0 = useRef(performance.now());
  const rd = A_ROUNDS[i];
  useEffect(() => { t0.current = performance.now(); }, [i]);

  const place = (kind, type) => {
    setSel(s => {
      const n = { ...s };
      if (n[kind] && n[kind] !== type) setChanges(c => c + 1);
      const other = kind === "most" ? "least" : "most";
      if (n[other] === type) n[other] = null;
      n[kind] = type;
      return n;
    });
    kind === "most" ? sfx.heart() : sfx.cloud();
  };
  const tapCard = type => {
    if (sel.most === type) { setSel({ ...sel, most: null }); sfx.tap(); return; }
    if (sel.least === type) { setSel({ ...sel, least: null }); sfx.tap(); return; }
    place(!sel.most ? "most" : !sel.least ? "least" : "least", type);
  };
  const dropAt = (kind, e, info) => {
    const x = e?.clientX ?? info.point.x - window.scrollX, y = e?.clientY ?? info.point.y - window.scrollY;
    const el = document.elementsFromPoint(x, y).find(n => n.dataset?.stall);
    if (el) place(kind, el.dataset.stall);
  };
  const next = () => {
    const rec = { round: rd.round, cards: rd.cards, most: sel.most, least: sel.least, ms: Math.round(performance.now() - t0.current), changes, at: new Date().toISOString() };
    const all = [...picks, rec];
    setSel({ most: null, least: null }); setChanges(0);
    if (i < A_ROUNDS.length - 1) { setPicks(all); setI(i + 1); sfx.whoosh(); }
    else { burst(); sfx.success(); onDone(all); }
  };
  const done = sel.most && sel.least;

  return (
    <div className="page">
      <Progress i={i} n={A_ROUNDS.length} label="Round" color="#FF3D7F" />
      {i === 0 ? <Guide text="Drag the heart onto the stall you'd love most, and the cloud onto the one you'd enjoy least. Or just tap two stalls." />
        : LINES[Math.floor(i / 2)] && i % 2 === 0 ? <Guide size={84} text={LINES[Math.floor(i / 2)]} /> : null}
      <AnimatePresence mode="wait">
        <motion.div key={i} className="stalls" initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -120, opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 24 }}>
          {rd.cards.map((c, k) => {
            const loved = sel.most === c.type, nope = sel.least === c.type;
            return (
              <motion.button type="button" key={c.id} data-stall={c.type} className={"stall " + (loved ? "loved" : nope ? "nope" : "")}
                style={{ "--a1": AWN[k][0], "--a2": AWN[k][1] }} onClick={() => tapCard(c.type)}
                aria-label={`${c.text}${loved ? ", loved" : nope ? ", not for me" : ""}`}
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: loved ? -1.5 : nope ? 1.5 : 0, scale: loved ? 1.03 : nope ? 0.97 : 1 }}
                transition={{ delay: k * 0.08, type: "spring", stiffness: 300, damping: 20 }} whileHover={{ y: -6 }}>
                <div className="awning" data-stall={c.type} />
                <div className="inner" data-stall={c.type}>
                  <motion.div className="pic" data-stall={c.type} animate={loved ? { rotate: [0, -10, 10, 0] } : {}}><Icon name={c.icon} size={42} stroke={2.2} /></motion.div>
                  <p data-stall={c.type}>{c.text}</p>
                </div>
                <AnimatePresence>
                  {(loved || nope) && (
                    <motion.span className={"token-on " + (loved ? "heart" : "cloud")} initial={{ scale: 0, y: -60 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                      <Icon name={loved ? "heart" : "cloud-drizzle"} size={32} stroke={2.6} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
      <div className="tray">
        <motion.div className={"token heart " + (sel.most ? "used" : "")} drag dragSnapToOrigin whileDrag={{ scale: 1.25, rotate: 12 }}
          onDragEnd={(e, info) => dropAt("most", e, info)} aria-hidden="true"><Icon name="heart" size={36} stroke={2.6} /></motion.div>
        <span className="lbl">I'd love this</span>
        <motion.div className={"token cloud " + (sel.least ? "used" : "")} drag dragSnapToOrigin whileDrag={{ scale: 1.25, rotate: -12 }}
          onDragEnd={(e, info) => dropAt("least", e, info)} aria-hidden="true"><Icon name="cloud-drizzle" size={36} stroke={2.6} /></motion.div>
        <span className="lbl">Not for me</span>
      </div>
      <div className="row" style={{ justifyContent: "center" }}>
        <Big color="sun" disabled={!done} onClick={next} icon="arrow-right">{i === A_ROUNDS.length - 1 ? "Leave the market" : "Next stalls"}</Big>
      </div>
    </div>
  );
}
