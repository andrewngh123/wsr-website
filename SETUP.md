# WSR Website — Setup Guide

This is your new WSR website built with **Next.js** (frontend) + **Supabase** (database) + **Vercel** (free hosting).

---

## Step 1 — Install dependencies (one-time)

Open a terminal in VS Code (`Terminal → New Terminal`), make sure you're inside the `wsr-website` folder, then run:

```
npm install
```

## Step 2 — Create a Vercel account (free)

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → choose **Continue with GitHub**
3. Authorize Vercel to access your GitHub account

## Step 3 — Push to GitHub

In VS Code terminal (inside `wsr-website`):

```bash
git init
git add .
git commit -m "Initial WSR website"
git branch -M main
```

Then on GitHub.com:
1. Click **New repository** → name it `wsr-website` → **Create**
2. Copy the commands GitHub shows you under "push an existing repository" and run them

## Step 4 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your `wsr-website` repository
3. Leave all settings as default
4. Click **Deploy** — your site will be live in ~2 minutes!

Vercel gives you a free URL like `wsr-website.vercel.app`. You can later connect your `sportsrankings.world` domain in Vercel's dashboard → Domains.

---

## Step 5 — Set up Supabase (free database)

### 5a — Create account & project
1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in with GitHub
2. Click **New project** → name it `wsr` → set a database password → **Create project**

### 5b — Create the tables
1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Open the file `scripts/schema.sql` from this project in VS Code
3. Copy the entire contents and paste into Supabase SQL Editor
4. Click **Run** — all tables will be created

### 5c — Import your data
1. In Supabase, go to **Table Editor** → select a table (e.g. `countries`)
2. Click **Insert** → **Import data from CSV**
3. Import the matching CSV from your `databasefiles/` folder:
   - `countries.csv` → `countries` table
   - `wrces_final.csv` → `wrces_rankings` table (map `rank`, `country_code`, `points`, `change`)
   - `wfcr.csv` → `wfcr_rankings` table
   - `wspi.csv` → `wspi_rankings` table
   - `wrces_merit.csv` → `merit_rankings` table

### 5d — Get your API keys
1. In Supabase: **Settings** → **API**
2. Copy **Project URL** and **anon public** key

### 5e — Add keys to Vercel
1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
3. Click **Save** → **Redeploy** from the Deployments tab

---

## Step 6 — Local development (optional)

To preview the site on your computer before deploying:

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase URL and key
3. Run: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

---

## Editing the site with Claude Code in VS Code

Once set up, you can edit anything by opening the `wsr-website` folder in VS Code and using the Claude chat panel. Examples of things you can ask:

- *"Change the homepage hero title to..."*
- *"Add a new testimonial from [name] that says..."*
- *"Update the accent color from gold to blue"*
- *"Add a new page called 'Partners'"*
- *"Update the 2026 rankings data"*
- *"Mark the 2026 ranking as final"* (flips the homepage label from "Provisional" to "Final" — set `LATEST_FINAL_YEAR` in `lib/format.ts`)

Claude will edit the correct files for you. After saving, Vercel automatically redeploys within ~30 seconds.

---

## File structure reference

```
wsr-website/
├── app/
│   ├── page.tsx                    ← Homepage
│   ├── rankings/page.tsx           ← Rankings table page
│   ├── about/page.tsx              ← About page
│   ├── countries/[code]/page.tsx   ← Individual country pages
│   ├── scientific-publications/    ← Publications page
│   └── media-release/             ← Press releases page
├── components/
│   ├── Navbar.tsx                  ← Top navigation bar
│   ├── Footer.tsx                  ← Footer
│   ├── CountryFlag.tsx             ← Flag image component
│   └── RankChange.tsx             ← ▲▼ rank change indicators
├── lib/
│   ├── supabase.ts                 ← Database connection
│   └── rankings.ts                 ← Data fetching functions
├── scripts/
│   └── schema.sql                  ← Database table definitions
└── tailwind.config.ts              ← Colors & design tokens
```

---

## Hidden admin dashboard ("Data desk")

A private dashboard for Nadim, Andrew and Maya to browse and edit the
DATA STORAGE / FINALRANKING data. It is not linked anywhere, and only answers
at a secret URL that is set in Vercel (this repo is public, so the URL is
never written in the code).

### One-time setup

1. **Create the private tables.** In Supabase → SQL Editor, paste and run
   `scripts/admin_schema.sql`. (Safe to re-run.) These `ds_*` tables are
   locked: the public website's key cannot read them.
2. **Add three env vars in Vercel** → Settings → Environment Variables
   (Production), then redeploy. Do NOT prefix them with `NEXT_PUBLIC_`.
   - `ADMIN_PATH` — the secret URL segment. Generate one with `openssl rand -hex 12`.
     The dashboard is then at `https://sportsrankings.world/<ADMIN_PATH>`.
   - `ADMIN_SESSION_SECRET` — `openssl rand -base64 48`
   - `SUPABASE_SERVICE_KEY` — Supabase → Settings → API → secret (service_role) key
3. **Load the data** from the Excel files (read straight from `../Ranking 26/`):
   ```
   .venv/bin/pip install openpyxl supabase      # first time only
   npm run admin:import -- --dry-run            # check, uploads nothing
   SUPABASE_SERVICE_KEY="sb_secret_..." npm run admin:import
   ```
4. **Create the three logins** (you'll be asked for each password — 12+ characters):
   ```
   SUPABASE_SERVICE_KEY="sb_secret_..." npm run admin:seed
   ```
   Reset one person's password later with `npm run admin:seed -- maya`
   (this also signs them out everywhere).

### Good to know

- Edits in the dashboard change the Supabase copy only, not the Excel files.
  Use **Data & editing → Export CSV** to bring them back into Excel.
- Re-running the import replaces all `ds_*` data with the workbook contents.
  If anyone has edited in the dashboard since the last import, it stops
  and asks for `--force`.
- The dashboard never changes the public rankings tables
  (`wrces_rankings` etc.). Those are still updated with `scripts/import_data.py`.
- 5 wrong passwords lock that account for 15 minutes.
- To switch the dashboard off, delete `ADMIN_PATH` in Vercel and redeploy.
