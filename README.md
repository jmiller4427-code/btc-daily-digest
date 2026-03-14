# ₿ BTC Daily Digest

> Real-time Bitcoin market intelligence dashboard. Live price every 30 seconds. AI-powered daily analysis. Free to host.

## How it works

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | HTML/CSS/JS — static, served by Netlify | Free |
| Live price | CoinGecko API, polled every 30s | Free |
| Fear & Greed | alternative.me API | Free |
| AI analysis | Claude AI + web search, runs daily at 6AM UTC | ~$0.05/day |
| Report cache | Supabase (Postgres) | Free |
| Hosting + cron | Netlify | Free |

## Setup

### 1 — Fork or clone this repo

Click **Fork** (top right on GitHub) — this puts a copy in your account.

### 2 — Create a Supabase database

1. Go to [supabase.com](https://supabase.com) → new project → name it `btc-digest`
2. Open **SQL Editor** and run:

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **service_role key**

### 3 — Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project → GitHub**
2. Select this repository
3. Netlify auto-detects `netlify.toml` — click **Deploy site**

### 4 — Add environment variables

In Netlify → **Site configuration → Environment variables**, add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key |

Then: **Deploys → Trigger deploy → Deploy site**

### 5 — Trigger the first AI run

Open your Netlify URL → click **↻ REFRESH AI** → wait ~60 seconds.

After that, the AI runs automatically every day at 6AM UTC.

## Project structure

```
btc-daily-digest/
├── public/
│   └── index.html              # Dashboard frontend
├── netlify/
│   └── functions/
│       ├── daily-digest.js     # Cron job — calls Claude AI, saves to Supabase
│       └── get-report.js       # API endpoint — serves cached report to browser
├── netlify.toml                # Netlify config + cron schedule
├── .gitignore
└── README.md
```

## Making changes

Edit any file → commit → push to GitHub → Netlify auto-deploys in ~30 seconds.

---

*Not financial advice. Do your own research.*
