# PSAP — PassPoint AI Learning Platform (Demo)

AI-powered educational platform for African students (Nursery → SS3), aligned with the Nigerian curriculum.

This repo contains a working **client demo** built with Vite + React + Tailwind, with a small Express server that proxies OpenAI requests so the API key stays off the browser.

---

## Screens

- **Login** — branded sign-in with email/password + Google placeholder
- **Dashboard** — daily stats, subjects, recent activity
- **AI Lesson** — interactive lesson with side panel AI tutor (live chat to OpenAI)
- **Subjects** — full subject grid (English, Maths, Science, etc.)
- **Progress** — weekly activity chart + subject mastery
- **Bookmarks** — saved lessons
- **Accomplishments** — badges & achievements
- **Settings** — profile, preferences, subscription

## Tech stack

- **Frontend:** Vite + React 19 + React Router + Tailwind CSS v3
- **Backend (proxy):** Node + Express, calls OpenAI Chat Completions
- **AI:** OpenAI `gpt-4.1` (configurable via env)

## Quickstart

```bash
# 1. Install
npm install

# 2. Create your env file
cp .env.example .env
# then edit .env and put your real OPENAI_API_KEY

# 3. Run both the Vite dev server and the API server
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5001
- Health: http://localhost:5001/api/health

## Environment variables

| Variable          | Default   | Notes                                   |
| ----------------- | --------- | --------------------------------------- |
| `AI_PROVIDER`     | `openai`  | Reserved for future provider switching  |
| `OPENAI_API_KEY`  | _(empty)_ | Required for live AI replies            |
| `OPENAI_MODEL`    | `gpt-4.1` | Any OpenAI chat-completions model       |
| `PORT`            | `5001`    | Port for the Express API proxy          |

## Project structure

```
passpoint-demo/
├── server/
│   └── index.js          # Express proxy → OpenAI
├── src/
│   ├── assets/           # Branded illustrations
│   ├── components/       # Logo, Sidebar, Topbar, Layout, icons
│   ├── pages/            # Login, Dashboard, Lesson, Subjects, ...
│   ├── store/user.jsx    # Auth context (localStorage-backed)
│   ├── App.jsx           # Router
│   └── main.jsx          # Entry
├── public/
└── .env                  # Local secrets (gitignored)
```

## Notes for the client demo

- The "Sign In" button accepts **any** email/password — there is no real auth yet (next step for production).
- The AI Tutor side panel makes real OpenAI calls if `OPENAI_API_KEY` is valid. Without a key, the lesson page falls back to a hard-coded JSS 1 Mathematics example so the UI still demos cleanly.
- Designed for desktop demo. Mobile responsive but not the focus for v0.

## Roadmap (from the PRD)

- Voice tutor (TTS + STT)
- Handwriting recognition for paper assignments
- Mathematics step-by-step solution checker
- Parent / School / Admin portals
- Multi-country (currency + curriculum) expansion
