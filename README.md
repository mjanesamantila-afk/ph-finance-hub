# Philippine Personal Finance Hub

A full-stack personal finance web app for tracking investments, stop-loss risk,
budgets, digital-bank savings, and a financial-freedom plan — tailored to the
Philippine context (PSE stocks, UITF, PERA, MP2, VUL, digital banks).

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend / Database:** Supabase (PostgreSQL + Auth)
- **Routing / Icons:** react-router-dom, lucide-react
- **Deployment:** Vercel

## Features

- **Dashboard** — totals, gain/loss, stop-loss alerts, allocation charts (by type & broker)
- **Portfolio** — holdings with broker filters, live PSE price refresh, add/edit/delete, per-holding stop-loss badges
- **Risk Management** — global stop-loss slider, breach alerts, per-position monitor
- **Budget** — Money System, Spending, Digital Banks, Ledger, and Monthly Summary sub-tabs
- **Freedom Plan** — 4% rule corpus target, FV projection, progress, and milestones

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm run dev
```

The app runs at http://localhost:5173.

### Environment variables

Create `.env.local` (git-ignored) with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates all tables, enables Row Level Security, and adds per-user policies.
3. Under **Authentication → Providers**, ensure **Email** is enabled.
   - For quick local testing you may disable "Confirm email" so sign-ups log in immediately.
4. Copy your project **URL** and **anon public key** (Settings → API) into `.env.local`.

On first login the app automatically creates a `user_settings` row and seeds the
four digital banks (Maribank, CIMB, Maya, GoTyme) at ₱0.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **New Project → Import** your GitHub repo.
   Vercel auto-detects Vite (build: `npm run build`, output: `dist`).
3. Add the environment variables under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. The included [`vercel.json`](vercel.json) rewrites all routes to
   `index.html` so client-side routing works on refresh/deep links.
5. If you haven't already, run [`supabase/schema.sql`](supabase/schema.sql) in the
   Supabase SQL editor.

## Notes

- Amounts default to **₱ (PHP)**; **GoTrade** holdings use **$ (USD)** and are never auto-converted.
- Stop-loss breach: `currentPricePerShare ≤ entryPrice × (1 − stopLossPct / 100)`.
- "Record interest" per digital bank is limited to once per calendar month.
- Month selectors show all 12 months of the current year.
- PSE prices are fetched client-side via the allorigins proxy (PSELookup primary, Yahoo Finance fallback).
