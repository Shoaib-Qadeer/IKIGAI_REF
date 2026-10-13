import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { ICONS } from "../core/icons.js";
import { sfx } from "../sound.js";

export function Icon({ name, size = 24, stroke = 2, className = "" }) {
  const p = ICONS[name];
  if (!p) return null;
  return (
    <svg className={"ico " + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: p }} />
  );
}

export const PALETTE = ["#FF3D7F", "#FFC93C", "#3D5AFE", "#22D3A6", "#FF7A2F", "#9B5CFF", "#00C2FF"];

export function burst(opts = {}) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  confetti({ particleCount: 90, spread: 75, startVelocity: 38, origin: { y: 0.65 }, colors: PALETTE, disableForReducedMotion: true, ...opts });
}

/* Kiko the toucan, drawn in SVG; bobs and blinks. */
export function Toucan({ size = 120, mood = "happy", flip = false }) {
  const reduce = useReducedMotion();
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 140); }, 3200 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true"
      style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
      animate={reduce ? {} : { y: [0, -6, 0], rotate: mood === "cheer" ? [0, -6, 6, 0] : [0, -2, 0] }}
      transition={{ duration: mood === "cheer" ? 0.8 : 2.6, repeat: Infinity, ease: "easeInOut" }}>
      <ellipse cx="58" cy="112" rx="28" ry="5" fill="rgba(27,19,64,.18)" />
      <path d="M40 104 L44 92 M62 104 L60 92" stroke="#FF7A2F" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="52" cy="66" rx="30" ry="32" fill="#1B1340" />
      <ellipse cx="56" cy="74" rx="17" ry="20" fill="#FFF4DC" />
      <motion.path d="M30 64 Q16 78 30 92 Q40 84 38 66 Z" fill="#3D5AFE"
        animate={reduce ? {} : { rotate: mood === "cheer" ? [0, -25, 0] : [0, -6, 0] }} style={{ originX: "36px", originY: "66px" }}
        transition={{ duration: mood === "cheer" ? 0.4 : 1.8, repeat: Infinity }} />
      <circle cx="62" cy="44" r="15" fill="#FFF4DC" />
      <circle cx="64" cy="44" r={blink ? 0.6 : 6} fill="#1B1340" />
      {!blink && <circle cx="66" cy="42" r="2" fill="#fff" />}
      <path d="M72 38 Q112 30 116 52 Q100 60 74 56 Z" fill="#FFC93C" />
      <path d="M74 56 Q100 60 116 52 Q108 64 76 62 Z" fill="#FF7A2F" />
      <path d="M108 42 Q116 46 116 52 Q110 48 104 48 Z" fill="#FF3D7F" />
      <path d="M44 30 Q50 18 58 28 Q62 16 68 30" stroke="#FF3D7F" strokeWidth="4" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}

/* Typewriter speech bubble. Click to finish the line instantly. */
export function Speech({ text, onDone, speed = 16, tail = "left" }) {
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  const done = n >= text.length;
  const doneRef = useRef(onDone); doneRef.current = onDone;
  useEffect(() => { setN(reduce ? text.length : 0); }, [text, reduce]);
  useEffect(() => {
    if (done) { doneRef.current?.(); return; }
    const id = setTimeout(() => { setN(x => x + 1); if (n % 3 === 0) sfx.blip(); }, speed);
    return () => clearTimeout(id);
  }, [n, done, speed]);
  return (
    <motion.div className={"speech tail-" + tail} onClick={() => setN(text.length)}
      initial={{ scale: 0.6, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
      <span aria-hidden="true">{text.slice(0, n)}<span className="ghost">{text.slice(n)}</span></span>
      <span className="sr-only">{text}</span>
    </motion.div>
  );
}

export function Guide({ text, mood = "happy", size = 110, onDone }) {
  return (
    <div className="guide">
      <Toucan size={size} mood={mood} />
      {text && <Speech text={text} onDone={onDone} />}
    </div>
  );
}

export function Big({ children, onClick, disabled, color = "pink", icon, className = "", type = "button" }) {
  return (
    <motion.button type={type} className={`big ${color} ${className}`} onClick={e => { if (!disabled) { sfx.pop(); onClick?.(e); } }}
      disabled={disabled} whileHover={disabled ? {} : { scale: 1.05, rotate: -1 }} whileTap={disabled ? {} : { scale: 0.94 }}>
      <span>{children}</span>{icon && <Icon name={icon} size={22} stroke={2.6} />}
    </motion.button>
  );
}

export function Pill({ children, onClick, active, className = "", title, ariaPressed }) {
  return (
    <motion.button type="button" className={`pill ${active ? "on" : ""} ${className}`} title={title} aria-pressed={ariaPressed}
      onClick={e => { sfx.tap(); onClick?.(e); }} whileTap={{ scale: 0.92 }}>{children}</motion.button>
  );
}

/* Animated sky/backdrop with drifting shapes, per chapter theme. */
const THEMES = {
  sunrise: ["#FF9A62", "#FF5E8A", "#7B5CFF"],
  market: ["#FFD23F", "#FF8A3D", "#FF3D7F"],
  story: ["#7B5CFF", "#C04CFF", "#FF5EAA"],
  cave: ["#0B8E8E", "#1C4E9E", "#3B2A7A"],
  lake: ["#00C2FF", "#22D3A6", "#7BE495"],
  fair: ["#FF5EAA", "#FFC93C", "#00C2FF"],
  festival: ["#3D5AFE", "#9B5CFF", "#FF3D7F"]
};
export function Backdrop({ theme }) {
  const [a, b, c] = THEMES[theme] || THEMES.sunrise;
  const shapes = useRef(Array.from({ length: 14 }, (_, i) => ({
    left: (i * 37) % 100, top: (i * 53) % 100, size: 18 + ((i * 29) % 60), kind: i % 4, dur: 14 + (i % 7) * 3, delay: -(i * 1.7), color: PALETTE[i % PALETTE.length]
  }))).current;
  return (
    <div className="backdrop" style={{ background: `radial-gradient(1200px 600px at 10% -10%, ${a}, transparent 60%), radial-gradient(900px 700px at 110% 20%, ${c}, transparent 60%), linear-gradient(160deg, ${a}, ${b} 55%, ${c})` }} aria-hidden="true">
      {shapes.map((s, i) => (
        <span key={i} className={"shape k" + s.kind} style={{ left: s.left + "%", top: s.top + "%", width: s.size, height: s.size, animationDuration: s.dur + "s", animationDelay: s.delay + "s", "--c": s.color }} />
      ))}
    </div>
  );
}

export function Progress({ i, n, label, color = "#1B1340" }) {
  return (
    <div className="prog" aria-label={`${label} ${Math.min(i + 1, n)} of ${n}`}>
      <span className="mono">{label} {Math.min(i + 1, n)}/{n}</span>
      <div className="dots">{Array.from({ length: n }, (_, k) => (
        <motion.i key={k} className={k < i ? "done" : k === i ? "now" : ""} layout style={{ "--c": color }} />))}</div>
    </div>
  );
}

/* A face drawn from value 1..5, used on the job fair and stepping stones. */
export function Face({ v, size = 40, color = "#1B1340" }) {
  const c = [-5, -2.4, 0, 2.6, 5.5][(v || 3) - 1];
  const mouth = c === 0 ? "M8 15.5 H16" : `M7 ${15.5 - c / 2} Q12 ${15.5 + c} 17 ${15.5 - c / 2}`;
  const brow = v === 1 ? <><path d="M6.5 7.5 L10 8.8" /><path d="M17.5 7.5 L14 8.8" /></> : null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      {v === 5 ? <><path d="M7.6 10 Q9 8 10.4 10" /><path d="M13.6 10 Q15 8 16.4 10" /></> : <><circle cx="9" cy="10" r="1.1" fill={color} /><circle cx="15" cy="10" r="1.1" fill={color} /></>}
      {brow}
      <path d={mouth} />
    </svg>
  );
}
export const FACE_COLORS = ["#7C8CFF", "#B49CFF", "#FFD23F", "#FF9A3D", "#FF3D7F"];
