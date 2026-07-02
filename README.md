# Growth Console

Local-only mission-control dashboard for a 12-week LinkedIn + Instagram growth sprint.
Everything persists to `data.json` on disk — no login, no cloud, no external database.

## Run it

```bash
npm install
npm run dev
```

This starts the Express API (`http://localhost:4001`) and the Vite dev server
(`http://localhost:5173`) together. Open `http://localhost:5173`.

The sprint start date is captured automatically on first run and stored in `data.json`.

## Optional: AI Engine for Content Feed

The Content Feed tab works out of the box with a Rule-Based suggestion engine (no key needed).
To enable the AI Engine (Claude-generated content ideas, refreshed once/day):

1. Go to [console.anthropic.com](https://console.anthropic.com), sign in, add a small amount of credit.
2. Create an API key under **Settings → API Keys**.
3. Copy `.env.example` to `.env` and paste your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Restart `npm run dev`. The toggle on the Content Feed tab will default to AI Engine.

`.env` and `data.json` are both gitignored — your key and your data never leave your machine
except for the one daily call to `api.anthropic.com` when the AI Engine is on.

## Tech

Vite + React + TypeScript + Tailwind CSS v4, Express + lowdb (`data.json`), recharts.
