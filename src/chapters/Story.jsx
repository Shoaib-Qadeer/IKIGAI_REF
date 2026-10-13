import React, { useState } from "react";
import { motion } from "framer-motion";
import { Big, Guide, Icon, Toucan } from "../components/ui.jsx";
import { sfx } from "../sound.js";
import { VERSION } from "../core/content.js";

const TITLE = "Island of Ikigai";
const TCOL = ["#FFC93C", "#fff", "#22D3A6", "#fff", "#FFC93C", "#fff"];

export function Welcome({ onStart, onExample }) {
  return (
    <div className="page">
      <span className="kicker">Prototype {VERSION} · for students 18+ finishing college or university</span>
      <h1 className="title" aria-label={TITLE}>
        {TITLE.split("").map((ch, i) => (
          <motion.span key={i} className="l" style={{ color: TCOL[i % TCOL.length] }}
            initial={{ y: -80, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.15 + i * 0.045 }}>
            {ch === " " ? " " : ch}
          </motion.span>
        ))}
      </h1>
      <p className="lede">A story-mode adventure about what kind of work pulls you. Four short chapters, about 25 minutes. At the end you get your island map: your work interests and working style, with every result traced back to what you did.</p>
      <Guide text="Hey, I'm Kiko! I'll be your guide around the island. There are no right or wrong moves here. Just play like yourself." />
      <div className="legs">
        {[
          ["#FFC93C", "heart", "Chapter 1", "Market of Maybes", "Hand out hearts and clouds to jobs"],
          ["#FF5EAA", "footprints", "Chapter 2", "Story Paths", "Ten moments, your next step"],
          ["#22D3A6", "gem", "Chapter 3", "Treasure Locks", "Crack word chests. Some are tricky"],
          ["#00C2FF", "waves", "Chapter 4", "Mirror Lake", "Fling cards onto stepping stones"]
        ].map(([c, ic, k, t, d], i) => (
          <motion.div key={t} className="card leg" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 + i * 0.12 }}
            whileHover={{ rotate: i % 2 ? 2 : -2, y: -4 }}>
            <span className="badge" style={{ background: c }}><Icon name={ic} size={28} stroke={2.4} /></span>
            <small className="mono">{k}</small><b>{t}</b><small>{d}</small>
          </motion.div>
        ))}
      </div>
      <p className="note">This is a research prototype, not a validated test. Everything stays in this browser unless you copy it out or turn on AI mode. Sound is on; use the speaker button to mute.</p>
      <div className="row">
        <Big onClick={onStart} icon="sailboat">Set sail</Big>
        <Big color="white" onClick={onExample} icon="map">See an example map</Big>
      </div>
    </div>
  );
}

const STAGES = ["Final-year bachelor's", "Graduated in the last 2 years", "Master's student", "Something else"];

export function Arrival({ setup, onBoard }) {
  const [s, setS] = useState(setup);
  const ok = s.adult && s.consent && s.stage;
  const stamp = k => { sfx.stamp(); setS(x => ({ ...x, [k]: !x[k] })); };
  return (
    <div className="page">
      <Guide text="Before we land, I need your boarding pass. Pick a luggage tag and stamp the two boxes." />
      <motion.div className="card pass" initial={{ rotate: -3, y: 60, opacity: 0 }} animate={{ rotate: 0, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
        <div className="main">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="mono">BOARDING PASS · ISLAND OF IKIGAI</span><Icon name="ticket" size={26} />
          </div>
          <label className="field">What should I call you? <small>Optional. Never sent to AI.</small>
            <input id="nick" value={s.nickname} onChange={e => setS({ ...s, nickname: e.target.value })} placeholder="e.g. Sana" maxLength={30} />
          </label>
          <div className="field">Where are you in your studies?
            <div className="tags" role="radiogroup" aria-label="Study stage">
              {STAGES.map((st, i) => (
                <motion.button type="button" key={st} role="radio" aria-checked={s.stage === st} className={"tag " + (s.stage === st ? "on" : "")}
                  onClick={() => { sfx.tap(); setS({ ...s, stage: st }); }} whileHover={{ rotate: i % 2 ? 3 : -3 }} whileTap={{ scale: 0.92 }}
                  animate={s.stage === st ? { rotate: [0, -8, 6, 0] } : {}}>{st}</motion.button>
              ))}
            </div>
          </div>
          <label className="field">Field of study <small>Optional. Shown on your map, never scored.</small>
            <input id="field" value={s.field} onChange={e => setS({ ...s, field: e.target.value })} placeholder="e.g. Computer Science" maxLength={60} />
          </label>
          <div className="stamps">
            {[["adult", "I am 18 or older."], ["consent", "I know this is a prototype and agree to play. Some puzzles are trickier than they look; Kiko explains at the end. Nothing leaves this browser unless I turn on AI mode, which sends only scores and reactions."]].map(([k, t]) => (
              <button type="button" key={k} className="stampbox" onClick={() => stamp(k)} aria-pressed={s[k]}>
                <span className="mono">{k === "adult" ? "AGE CHECK" : "CONSENT"}</span><p>{t}</p>
                {s[k] && <motion.span className="stampmark" initial={{ scale: 2.4, opacity: 0, rotate: 10 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>OK!</motion.span>}
                {!s[k] && <span className="small" style={{ opacity: .6 }}>Tap to stamp</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="stub">
          <Toucan size={96} mood={ok ? "cheer" : "happy"} />
          <b>{ok ? "Ready to land!" : "Stamp both boxes"}</b>
          <Big color="pink" disabled={!ok} onClick={() => onBoard(s)} icon="arrow-right">Board</Big>
        </div>
      </motion.div>
    </div>
  );
}

const CHAPTERS = {
  1: { title: "Market of Maybes", line: "Welcome to the market! Every stall offers a different kind of work. In each round, give your heart to the one you'd most enjoy and a rain cloud to the one you'd least enjoy. Think about the activity itself, not the pay.", color: "#FFC93C" },
  2: { title: "Story Paths", line: "Now let's walk through your last term before graduation. Ten little moments. Pick the path you'd most likely take, not the one you think you should.", color: "#FF5EAA" },
  3: { title: "Treasure Locks", line: "Deep in the cave there are eight treasure chests. Each opens with a six-letter word using all its letter gems. Tap the gems to build it. Take your time, or leave a chest whenever you like.", color: "#22D3A6" },
  4: { title: "Mirror Lake", line: "The lake shows you yourself. Fling each card onto the stepping stone that fits you, from “that's not me” to “that's me”. Then visit the job fair on the far shore.", color: "#00C2FF" }
};
export function ChapterIntro({ n, onGo }) {
  const c = CHAPTERS[n];
  return (
    <div className="chapter">
      <motion.div className="chapnum" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 12 }}>{n}</motion.div>
      <motion.h2 className="h2" initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25, type: "spring" }} onAnimationStart={() => sfx.whoosh()}>
        Chapter {n}: {c.title}
      </motion.h2>
      <Guide text={c.line} />
      <div><Big color="sun" onClick={onGo} icon="arrow-right">Let's go</Big></div>
    </div>
  );
}
