import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { DECK, ZONES, INTEREST_ITEMS, LIKE_SCALE } from "../core/content.js";
import { Big, Face, FACE_COLORS, Guide, Icon, Progress, burst } from "../components/ui.jsx";
import { sfx } from "../sound.js";

const STONE = ["#9AA8FF", "#C7B6FF", "#FFE08A", "#FFB27A", "#FF8FB8"];

export function Lake({ answers: init, onDone }) {
  const [i, setI] = useState(-1); // -1 = practice card
  const [answers, setAnswers] = useState(init || {});
  const [times, setTimes] = useState({});
  const [hot, setHot] = useState(null);
  const [flash, setFlash] = useState("");
  const t0 = useRef(performance.now());
  const lockRef = useRef(false);
  const ctl = useAnimationControls();
  useEffect(() => {
    t0.current = performance.now();
    ctl.set({ x: 0, y: -40, rotate: -6, scale: 1, opacity: 0 });
    ctl.start({ y: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 22 } });
  }, [i]); // eslint-disable-line

  const answer = async v => {
    if (lockRef.current || i >= DECK.length) return;
    lockRef.current = true; setHot(null);
    const stone = document.querySelector(`[data-stone="${v}"]`), card = document.getElementById("mcard");
    sfx.splash();
    if (stone && card) {
      const a = card.getBoundingClientRect(), b = stone.getBoundingClientRect();
      await ctl.start({ x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top - (a.top + a.height / 2), scale: 0.2, rotate: 20, opacity: 0, transition: { duration: 0.32, ease: "easeIn" } });
    }
    if (i === -1) { setFlash("Practice done! From here on, every card counts."); }
    else {
      const it = DECK[i];
      setAnswers(x => ({ ...x, [it.id]: v }));
      setTimes(x => ({ ...x, [it.id]: Math.round(performance.now() - t0.current) }));
      setFlash("");
    }
    lockRef.current = false;
    setI(n => n + 1);
  };
  const where = (e, info) => {
    const x = e?.clientX ?? info.point.x - window.scrollX, y = e?.clientY ?? info.point.y - window.scrollY;
    const el = document.elementsFromPoint(x, y).find(n => n.closest?.("[data-stone]"));
    return el ? +el.closest("[data-stone]").dataset.stone : null;
  };
  useEffect(() => {
    const k = e => { if (/^[1-5]$/.test(e.key)) answer(+e.key); else if (e.key === "Backspace" && i > 0) { e.preventDefault(); setI(i - 1); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  const finished = i >= DECK.length;
  const it = i >= 0 && !finished ? DECK[i] : null;
  const prev = it ? answers[it.id] : null;

  return (
    <div className="page">
      {!finished && i >= 0 && <Progress i={i} n={DECK.length} label="Card" color="#00C2FF" />}
      {i === -1 && <Guide text="Here's a practice card. Drag it onto a stepping stone, tap a stone, or press 1 to 5. Read every card as if it starts with “I”. Describe yourself as you are now, not as you wish to be." />}
      {finished ? (
        <motion.div className="card" initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          <h2 style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: "2rem" }}>All {DECK.length} cards are across the lake!</h2>
          <p>Last stop: the dream job fair on the far shore.</p>
          <div className="row">
            <Big color="pink" onClick={() => { burst(); onDone(answers, times); }} icon="tent-tree">Go to the job fair</Big>
            <Big color="white" className="small" onClick={() => setI(DECK.length - 1)} icon="undo-2">Undo last card</Big>
          </div>
        </motion.div>
      ) : (
        <div className="lake">
          <div className="deck">
            {i < DECK.length - 1 && <div className="under" />}
            <motion.div id="mcard" key={i} className={"mcard " + (i === -1 ? "practice" : "")} animate={ctl} drag dragSnapToOrigin
              whileDrag={{ scale: 1.05, rotate: 6, cursor: "grabbing" }} dragElastic={0.9}
              onDrag={(e, info) => setHot(where(e, info))}
              onDragEnd={(e, info) => { const v = where(e, info); setHot(null); if (v) answer(v); }}>
              <span className="i">{i === -1 ? "PRACTICE · NOT SCORED" : "I…"}</span>
              <p className="say">{i === -1 ? "Enjoy spicy food." : it.text}</p>
              {i === -1 && <p className="small">Usually order the spicy option? That's <b>Kind of me</b>.</p>}
              {flash && i >= 0 && <p className="small" style={{ color: "var(--blue)", fontWeight: 600 }}>{flash}</p>}
            </motion.div>
          </div>
          <div className="stones" role="group" aria-label="How well does this describe you?">
            {ZONES.map(([v, anchor, friendly]) => (
              <motion.button type="button" key={v} data-stone={v} className={"stone " + (hot === v ? "hot" : "") + (prev === v ? " was" : "")}
                style={{ "--sc": STONE[v - 1] }} onClick={() => answer(v)} whileHover={{ y: -6 }} whileTap={{ scale: 0.92 }}
                animate={{ y: [0, -3, 0] }} transition={{ y: { duration: 2 + v * 0.3, repeat: Infinity } }}>
                <Face v={v} size={30} /><b>{friendly}</b><small>{anchor}</small>
              </motion.button>
            ))}
          </div>
          {i > 0 && <Big color="white" className="small" onClick={() => setI(i - 1)} icon="undo-2">Undo last card</Big>}
        </div>
      )}
    </div>
  );
}

/* Joy-o-meter: drag the face along the track; snaps to 5 steps. Arrow keys work too. */
function Joy({ value, onChange, label }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);
  const v = drag ?? value;
  const setFromX = clientX => {
    const r = ref.current.getBoundingClientRect(), inner = r.width - 48;
    const t = Math.min(1, Math.max(0, (clientX - r.left - 24) / inner));
    return Math.round(t * 4) + 1;
  };
  const pos = vv => `calc(24px + (100% - 48px) * ${((vv || 3) - 1) / 4})`;
  const commit = nv => { if (nv !== value) { sfx.slide(nv); onChange(nv); } };
  return (
    <div>
      <div ref={ref} className={"joy " + (v ? "" : "unset")} role="slider" tabIndex={0} aria-label={label} aria-valuemin={1} aria-valuemax={5}
        aria-valuenow={value || undefined} aria-valuetext={value ? LIKE_SCALE[value - 1] : "Not rated"}
        onPointerDown={e => { ref.current.setPointerCapture(e.pointerId); const nv = setFromX(e.clientX); setDrag(nv); }}
        onPointerMove={e => { if (drag != null) { const nv = setFromX(e.clientX); if (nv !== drag) { sfx.tick(); setDrag(nv); } } }}
        onPointerUp={e => { if (drag != null) { commit(setFromX(e.clientX)); setDrag(null); } }}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={e => { if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); commit(Math.min(5, (value || 2) + 1)); } if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); commit(Math.max(1, (value || 4) - 1)); } }}>
        <div className="track" />
        {[1, 2, 3, 4, 5].map(k => <span key={k} className="notch" style={{ left: pos(k) }} />)}
        <motion.div className="knob" style={{ left: pos(v), background: v ? FACE_COLORS[v - 1] : "#fff" }} animate={{ scale: drag != null ? 1.18 : 1, rotate: v ? (v - 3) * 6 : 0 }}>
          <Face v={v || 3} size={34} />
        </motion.div>
      </div>
      <div className="joy-label">{v ? LIKE_SCALE[v - 1] : "Slide the face"}</div>
    </div>
  );
}

export function Fair({ answers: init, onDone }) {
  const [answers, setAnswers] = useState(init || {});
  const [practice, setPractice] = useState(null);
  const n = INTEREST_ITEMS.filter(it => answers[it.id]).length;
  const tint = v => v ? FACE_COLORS[v - 1] + "55" : "#fff";
  return (
    <div className="page">
      <span className="kicker">Mirror Lake · the far shore</span>
      <h2 className="h2">The Dream Job Fair</h2>
      <Guide size={90} text="Every booth is a job activity. Slide the face to show how much you'd enjoy doing it at work, from grumpy to beaming. Try the dashed practice booth first." />
      <div className="fair">
        <motion.div className="booth practice" style={{ "--bc": tint(practice) }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="head"><span className="pic"><Icon name="utensils" size={28} /></span><div><span className="mono">PRACTICE · NOT SCORED</span><p>Plan the menu for a large wedding</p></div></div>
          <Joy value={practice} onChange={setPractice} label="Practice: plan the menu for a large wedding" />
        </motion.div>
        {INTEREST_ITEMS.map((it, k) => (
          <motion.div key={it.id} className="booth" style={{ "--bc": tint(answers[it.id]) }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 * k }}>
            <div className="head"><span className="pic"><Icon name={it.icon} size={28} /></span><p>{it.text}</p></div>
            <Joy value={answers[it.id]} onChange={v => setAnswers(a => ({ ...a, [it.id]: v }))} label={it.text} />
          </motion.div>
        ))}
      </div>
      <div className="row" style={{ justifyContent: "center" }}>
        <span className="kicker">{n} of {INTEREST_ITEMS.length} booths rated</span>
        <Big color="pink" disabled={n < INTEREST_ITEMS.length} onClick={() => { sfx.fanfare(); onDone(answers); }} icon="map">Reveal my island map</Big>
      </div>
    </div>
  );
}
