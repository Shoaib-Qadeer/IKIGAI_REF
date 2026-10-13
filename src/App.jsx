import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { renderToStaticMarkup } from "react-dom/server";
import cssText from "./styles.css?inline";
import { A_ROUNDS, B_SCENES, VERSION, buildProfile } from "./core/content.js";
import { Backdrop, Icon } from "./components/ui.jsx";
import { setMusic, setSfx, sfx, unlockAudio } from "./sound.js";
import { Arrival, ChapterIntro, Welcome } from "./chapters/Story.jsx";
import Market from "./chapters/Market.jsx";
import Paths from "./chapters/Paths.jsx";
import Locks, { LocksDebrief } from "./chapters/Locks.jsx";
import { Fair, Lake } from "./chapters/Lake.jsx";
import { Evidence, Finale, exportData } from "./chapters/Finale.jsx";
import { AiSettings } from "./ai.jsx";

const fresh = () => ({
  example: false, startedAt: null, finishedAt: null,
  setup: { adult: false, consent: false, stage: "", field: "", nickname: "" },
  A: { picks: [] }, B: { levels: {}, log: [] }, C: { results: [] }, SR: { answers: {}, times: {} },
  reactions: {}, notes: {}, profile: null
});
const THEME = { welcome: "sunrise", arrival: "sunrise", ch1: "market", A: "market", ch2: "story", B: "story", ch3: "cave", C: "cave", debrief: "cave", ch4: "lake", lake: "lake", fair: "fair", finale: "festival" };
const STAR = { welcome: -1, arrival: 0, ch1: 1, A: 1, ch2: 2, B: 2, ch3: 3, C: 3, debrief: 3, ch4: 4, lake: 4, fair: 4, finale: 5 };

function makeExample() {
  const s = fresh(); s.example = true;
  s.setup = { adult: true, consent: true, stage: "Final-year bachelor's", field: "Computer Science", nickname: "Example student" };
  s.startedAt = "2026-10-13T10:00:00.000Z"; s.finishedAt = "2026-10-13T10:27:00.000Z";
  const pref = ["I", "A", "S", "C", "E", "R"];
  s.A.picks = A_ROUNDS.map(rd => { const ts = rd.cards.map(c => c.type).sort((a, b) => pref.indexOf(a) - pref.indexOf(b));
    return { round: rd.round, cards: rd.cards, most: ts[0], least: ts[2], ms: 4200 + rd.round * 130, changes: rd.round === 5 ? 1 : 0 }; });
  const lv = { E1: 2, E2: 2, A1: 3, A2: 4, C1: 4, C2: 3, N1: 2, N2: 3, O1: 4, O2: 3 };
  s.B.levels = lv; s.B.log = B_SCENES.map((sc, i) => ({ id: sc.id, trait: sc.trait, level: lv[sc.id], ms: 6000 + i * 300, changes: i === 3 ? 1 : 0 }));
  s.C.results = [
    { n: 1, seconds: 22.4, guesses: 3, guessList: ["MAKTER", "MARTEK", "MARKET"], shuffles: 0, outcome: "solved" },
    { n: 2, seconds: 31.0, guesses: 2, guessList: ["BIRDGE", "BRIDGE"], shuffles: 1, outcome: "solved" },
    { n: 3, seconds: 64.2, guesses: 5, guessList: ["BISKET", "BESKIT", "KISBET", "TIKBES", "BETSKI"], shuffles: 2, outcome: "skipped" },
    { n: 4, seconds: 18.7, guesses: 1, guessList: ["POCKET"], shuffles: 0, outcome: "solved" },
    { n: 5, seconds: 90.0, guesses: 2, guessList: ["PREWIN", "WINPER"], shuffles: 1, outcome: "timeout" },
    { n: 6, seconds: 40.3, guesses: 2, guessList: ["JUNGEL", "JUNGLE"], shuffles: 0, outcome: "solved" },
    { n: 7, seconds: 12.5, guesses: 1, guessList: ["MORTIL"], shuffles: 0, outcome: "skipped" },
    { n: 8, seconds: 90.0, guesses: 4, guessList: ["WOWDIN", "DOWWIN", "WINDWO", "WIDNOW"], shuffles: 3, outcome: "timeout" }];
  s.SR.answers = { M1: 2, M6: 4, M11: 2, M16: 4, M2: 4, M7: 2, M12: 4, M17: 1, M3: 4, M8: 2, M13: 5, M18: 2, M4: 2, M9: 4, M14: 2, M19: 4, M5: 5, M10: 1, M15: 2, M20: 1,
    I1: 2, I7: 2, I2: 5, I8: 4, I3: 4, I9: 3, I4: 4, I10: 3, I5: 2, I11: 1, I6: 3, I12: 3, P1: 4, P2: 2 };
  s.profile = buildProfile({ A: { picks: s.A.picks }, B: { levels: s.B.levels }, C: { results: s.C.results }, SR: { answers: s.SR.answers } });
  return s;
}

let dlNs; // claude.ai downloads capability, null elsewhere
async function saveFile(name, text, type) {
  if (dlNs === undefined) dlNs = window.claude?.use ? await window.claude.use("downloads").catch(() => null) : null;
  if (dlNs) { await dlNs.save({ filename: name, data: text }); return "Saved."; }
  const b = new Blob([text], { type }), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  return "Downloaded.";
}

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [sess, setSess] = useState(fresh);
  const [ai, setAi] = useState({ enabled: false, key: "", model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1", log: [], server: false, serverKey: false, busy: false, error: "" });
  const [snd, setSnd] = useState({ sfx: true, music: false });
  const [showAi, setShowAi] = useState(false);
  const [tab, setTab] = useState("map");

  useEffect(() => { (async () => { try { const r = await fetch("api/health", { cache: "no-store" }); if (r.ok) { const j = await r.json(); if (j?.ok) setAi(a => ({ ...a, server: true, serverKey: !!j.serverKey })); } } catch (e) { } })(); }, []);
  useEffect(() => { setSfx(snd.sfx); setMusic(snd.music); }, [snd]);

  const up = fn => setSess(s => { const n = structuredClone(s); fn(n); return n; });
  const go = useCallback(sc => { setScreen(sc); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const start = () => { unlockAudio(); sfx.chime(); setSess(fresh()); setSnd(s => ({ ...s, music: true })); go("arrival"); };
  const example = () => { unlockAudio(); sfx.fanfare(); setSess(makeExample()); setTab("map"); go("finale"); };
  const finish = (answers, times) => up(s => {
    s.SR.answers = { ...s.SR.answers, ...answers }; if (times) s.SR.times = { ...s.SR.times, ...times };
  });
  const reveal = jobAnswers => up(s => {
    s.SR.answers = { ...s.SR.answers, ...jobAnswers }; s.finishedAt = new Date().toISOString();
    s.profile = buildProfile({ A: { picks: s.A.picks }, B: { levels: s.B.levels }, C: { results: s.C.results }, SR: { answers: s.SR.answers } });
  });
  const download = async (kind, setMsg) => {
    const d = (sess.finishedAt || new Date().toISOString()).slice(0, 10);
    try {
      if (kind === "json") setMsg(await saveFile(`island-of-ikigai-${d}.json`, JSON.stringify(exportData(sess, ai), null, 2), "application/json"));
      else {
        const body = renderToStaticMarkup(<Evidence sess={sess} ai={ai} forFile />);
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Evidence report · Island of Ikigai ${VERSION}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;600;700&family=Space+Mono&display=swap"><style>${cssText} body{background:#7B5CFF}</style></head><body><main class="stage"><div class="page"><h1 class="h2">Evidence report</h1>${body}</div></main></body></html>`;
        setMsg(await saveFile(`evidence-report-${d}.html`, html, "text/html"));
      }
    } catch (e) { setMsg(e?.code === "declined" ? "Download cancelled." : "Couldn't save the file here. Use Copy JSON instead."); }
  };

  const screens = {
    welcome: <Welcome onStart={start} onExample={example} />,
    arrival: <Arrival setup={sess.setup} onBoard={s => { up(x => { x.setup = s; x.startedAt = new Date().toISOString(); }); sfx.chime(); go("ch1"); }} />,
    ch1: <ChapterIntro n={1} onGo={() => go("A")} />,
    A: <Market onDone={picks => { up(s => { s.A.picks = picks; }); go("ch2"); }} />,
    ch2: <ChapterIntro n={2} onGo={() => go("B")} />,
    B: <Paths onDone={log => { up(s => { s.B.log = log; s.B.levels = Object.fromEntries(log.map(l => [l.id, l.level])); }); go("ch3"); }} />,
    ch3: <ChapterIntro n={3} onGo={() => go("C")} />,
    C: <Locks onDone={res => { up(s => { s.C.results = res; }); go("debrief"); }} />,
    debrief: <LocksDebrief results={sess.C.results} onGo={() => go("ch4")} />,
    ch4: <ChapterIntro n={4} onGo={() => go("lake")} />,
    lake: <Lake answers={sess.SR.answers} onDone={(a, t) => { finish(a, t); go("fair"); }} />,
    fair: <Fair answers={sess.SR.answers} onDone={a => { reveal(a); setTab("map"); go("finale"); }} />,
    finale: <Finale sess={sess} tab={tab} setTab={setTab} ai={ai} setAi={setAi}
      react={(id, v) => up(s => { s.reactions[id] = v; })} note={(id, v) => setSess(s => ({ ...s, notes: { ...s.notes, [id]: v } }))}
      onRestart={() => { setSess(fresh()); go("welcome"); }} onDownload={download} />
  };
  const star = STAR[screen];

  return (
    <MotionConfig reducedMotion="user">
      <Backdrop theme={THEME[screen]} />
      <div className="app">
        <header className="top">
          <button type="button" className="logo" style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }} onClick={() => go("welcome")}>Island of Ikigai</button>
          <div className="stars" aria-label="Chapter progress">{[0, 1, 2, 3, 4, 5].map(k => <i key={k} className={star > k ? "done" : star === k ? "now" : ""} />)}</div>
          <div className="tools">
            <button type="button" className={"round " + (snd.sfx ? "on" : "")} aria-pressed={snd.sfx} title="Sound effects" aria-label="Sound effects" onClick={() => { unlockAudio(); setSnd(s => ({ ...s, sfx: !s.sfx })); }}><Icon name={snd.sfx ? "volume-2" : "volume-x"} size={20} /></button>
            <button type="button" className={"round " + (snd.music ? "on" : "")} aria-pressed={snd.music} title="Music" aria-label="Music" onClick={() => { unlockAudio(); setSnd(s => ({ ...s, music: !s.music })); }}><Icon name="music-2" size={20} /></button>
            <button type="button" className={"round ai " + (ai.enabled ? "on" : "")} onClick={() => setShowAi(true)}><Icon name="bot" size={18} />AI</button>
          </div>
        </header>
        <main className="stage">
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.98 }} transition={{ duration: 0.35 }}>
              {screens[screen]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {showAi && <AiSettings ai={ai} setAi={setAi} onClose={() => setShowAi(false)} />}
    </MotionConfig>
  );
}
