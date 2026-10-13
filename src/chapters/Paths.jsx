import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { B_SCENES } from "../core/content.js";
import { Big, Icon, Progress, Speech, burst } from "../components/ui.jsx";
import { sfx } from "../sound.js";

// Signpost colours follow display position, never the option's level.
const PCOL = ["#FFC93C", "#22D3A6", "#00C2FF", "#FF9AC0"];
const ART = ["#9B5CFF", "#FF3D7F", "#3D5AFE", "#FF7A2F", "#12B886"];
const SIGN = ["footprints", "arrow-right", "sprout", "star"];

export default function Paths({ onDone }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [changes, setChanges] = useState(0);
  const [log, setLog] = useState([]);
  const [ready, setReady] = useState(false);
  const t0 = useRef(performance.now());
  const sc = B_SCENES[i];
  useEffect(() => { t0.current = performance.now(); setReady(false); }, [i]);

  const pick = oi => { if (sel !== null && sel !== oi) setChanges(c => c + 1); setSel(oi); sfx.pop(); };
  const next = () => {
    const level = sel + 1;
    const rec = { id: sc.id, trait: sc.trait, level, ms: Math.round(performance.now() - t0.current), changes, at: new Date().toISOString() };
    const all = [...log, rec];
    setSel(null); setChanges(0);
    if (i < B_SCENES.length - 1) { setLog(all); setI(i + 1); sfx.whoosh(); }
    else { burst({ shapes: ["star"] }); sfx.success(); onDone(all); }
  };

  return (
    <div className="page">
      <Progress i={i} n={B_SCENES.length} label="Scene" color="#9B5CFF" />
      <AnimatePresence mode="wait">
        <motion.div key={sc.id} className="page" initial={{ rotateY: -70, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 70, opacity: 0 }} transition={{ duration: 0.45 }} style={{ transformPerspective: 1200 }}>
          <div className="card panel">
            <div className="art" style={{ background: ART[i % ART.length] }}>
              <motion.div className="blob" animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.05, 0.97, 1] }} transition={{ duration: 6, repeat: Infinity }} />
              <motion.div style={{ position: "relative", color: "#1B1340" }} initial={{ scale: 0 }} animate={{ scale: 1, y: [0, -8, 0] }} transition={{ scale: { type: "spring", delay: 0.2 }, y: { duration: 2.4, repeat: Infinity } }}>
                <Icon name={sc.icon} size={86} stroke={2} />
              </motion.div>
              {[0, 1, 2].map(k => (
                <motion.span key={k} className="spark" style={{ left: 20 + k * 70, top: 18 + (k % 2) * 150 }} animate={{ scale: [0.6, 1.2, 0.6], rotate: [0, 90, 180] }} transition={{ duration: 2 + k, repeat: Infinity }}>
                  <Icon name="sparkles" size={22} />
                </motion.span>
              ))}
            </div>
            <div className="text">
              <span className="mono">SCENE {i + 1}</span>
              <h3>{sc.title}</h3>
              <Speech key={sc.id} text={sc.text} speed={14} tail="none" onDone={() => setReady(true)} />
            </div>
          </div>
          <div className="paths" role="radiogroup" aria-label="What would you do?">
            {sc.order.map((oi, k) => (
              <motion.button type="button" key={oi} role="radio" aria-checked={sel === oi}
                className={"path " + (sel === oi ? "on" : sel !== null ? "dim" : "")} style={{ "--pc": PCOL[k] }} onClick={() => pick(oi)}
                initial={{ y: 40, opacity: 0, rotate: k % 2 ? 2 : -2 }} animate={ready ? { y: 0, opacity: 1, rotate: sel === oi ? 0 : k % 2 ? 1.5 : -1.5, scale: sel === oi ? 1.04 : 1 } : { y: 40, opacity: 0 }}
                transition={{ delay: ready ? k * 0.08 : 0, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ y: -4, rotate: 0 }} whileTap={{ scale: 0.95 }}>
                <span className="sign"><Icon name={sel === oi ? "check" : SIGN[k]} size={20} stroke={2.6} /></span>
                {sc.options[oi]}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="row" style={{ justifyContent: "center" }}>
        {!ready && <Big color="white" className="small" onClick={() => setReady(true)}>Show the paths</Big>}
        <Big color="sun" disabled={sel === null} onClick={next} icon="arrow-right">{i === B_SCENES.length - 1 ? "Finish the story" : "Walk on"}</Big>
      </div>
    </div>
  );
}
