<<<<<<< HEAD
# Island of Self Exploration (prototype v0.2.0)

A story-mode game for students aged 18+ that builds an explainable profile of
work interests and working style. Kiko the toucan guides players through four
chapters; every result traces back to what they did, through fixed scoring rules.

| Chapter | What you do | What it measures |
| --- | --- | --- |
| 1 · Market of Maybes | Drag a heart and a cloud onto job stalls, 12 rounds | Work interests (RIASEC) |
| 2 · Story Paths | Pick a signpost in 10 animated scenes | Big Five tendencies |
| 3 · Treasure Locks | Tap letter gems to open 8 word chests (3 have no answer) | Persistence |
| 4 · Mirror Lake | Fling 22 cards onto stepping stones; slide faces at a job fair | Validated self-report anchor (Mini-IPIP + interests) |

## Tech

- React 18 + Vite, animations with framer-motion, confetti with canvas-confetti
- Sound is synthesized live with the Web Audio API (`src/sound.js`): no audio files
- Scoring is pure and deterministic: `src/core/content.js` (same rules as the
  Design & Scoring Specification)
- `api/ai.js` and `api/health.js`: Vercel serverless functions for the optional AI coach

## Run locally

```
npm install
npm run dev
```

## Deploy on Vercel

1. Push this folder to a GitHub repository (the `.gitignore` keeps `node_modules` out).
2. On vercel.com: **Add New → Project**, import the repo. Vercel detects Vite
   automatically (build `npm run build`, output `dist`). Click **Deploy**.
3. Optional: in **Settings → Environment Variables** add `OPENAI_API_KEY`, then redeploy.
   Without it, players can paste their own key in AI mode.
   Optional extras: `AI_BASE_URL` (another OpenAI-compatible provider), `AI_ALLOWED_MODELS`.

Or from a terminal: `npx vercel` then `npx vercel --prod`.

`npm run build:single` makes a one-file version in `dist-single/` for sharing as a single HTML page.

## Data

Nothing is stored on a server. Sessions stay in the browser until the player
copies or downloads them. Get consent forms and ethics review before testing with other students.
=======
# SELF_EXPLORATION
>>>>>>> 7024febe7815534760a1fb6306331f41f6eeada4
