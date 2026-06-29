# Deploying PassPoint Demo to Vercel

The app deploys as **one Vercel project** — Vite builds the static frontend
and `/api/*` routes become serverless functions automatically.

## 1. Connect the repo

1. Push the latest code to GitHub (this repo is already at
   `CodeSinc-Digi-House/PSAP`).
2. In <https://vercel.com>, click **Add New → Project**, import the repo.
3. Vercel auto-detects Vite — accept the defaults:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

## 2. Add environment variables

In the Vercel project: **Settings → Environment Variables**. Apply each to
Production, Preview, and Development.

| Key                  | Value                                      | Required for default setup? |
| -------------------- | ------------------------------------------ | --------------------------- |
| `AI_PROVIDER`        | `groq`                                     | ✅                          |
| `GROQ_API_KEY`       | `gsk_…`                                    | ✅                          |
| `GROQ_MODEL`         | `llama-3.3-70b-versatile`                  | optional                    |
| `OPENROUTER_API_KEY` | `sk-or-v1-…`                               | only if you switch          |
| `OPENROUTER_MODEL`   | `google/gemma-4-31b-it:free`               | only if you switch          |
| `OPENAI_API_KEY`     | `sk-proj-…`                                | only if you switch          |
| `OPENAI_MODEL`       | `gpt-4.1`                                  | only if you switch          |

**Do NOT set `PORT`** — Vercel manages that.

## 3. Redeploy

Env vars are baked in at deploy time, not hot-reloaded. After adding/changing
them, trigger a redeploy:

- **Deployments** tab → click the latest deployment → **Redeploy** (top right)
- Or push a new commit — Vercel auto-redeploys

## 4. Verify

After the deploy finishes, open:

- `https://<your-project>.vercel.app/` — should load the Login screen
- `https://<your-project>.vercel.app/api/health` — should return JSON like:
  ```json
  {
    "ok": true,
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "hasKey": true,
    "runtime": "vercel"
  }
  ```

If `hasKey` is `false`, the env var didn't make it — recheck step 2 and redeploy.

## 5. Switching providers in production

To switch to OpenRouter:

1. Vercel **Settings → Environment Variables** → change `AI_PROVIDER` to
   `openrouter` (make sure `OPENROUTER_API_KEY` is also set).
2. **Deployments** → latest → **Redeploy**.

## Architecture summary

```
psap-ashen.vercel.app/
├── /                    → React SPA (Vite build output)
├── /api/health          → serverless function (api/health.js)
├── /api/chat            → serverless function (api/chat.js)
└── /api/lesson          → serverless function (api/lesson.js)
```

All `/api/*` functions import shared logic from `lib/provider.js`.

The local Express server (`server/index.js`) imports the **same** handlers, so
running `npm run dev` exercises the exact same code path as production.

## Common issues

| Symptom                                      | Fix                                                              |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `404 on /api/lesson` after deploy            | API functions missing — make sure `api/` folder is committed     |
| React Router routes 404 on refresh           | `vercel.json` SPA rewrite missing — make sure it's committed     |
| `hasKey: false` in `/api/health`             | Env var not set OR not redeployed after adding it                |
| Chat returns "rate-limited upstream"         | Free OpenRouter model throttled — switch `AI_PROVIDER` to `groq` |
| `invalid_api_key`                            | Key was revoked / has typo — generate a fresh one and redeploy   |
