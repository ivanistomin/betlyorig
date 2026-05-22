# Betly — Telegram Mini App

A gamified habit-betting app: stake virtual GEMS on a goal, complete it for a reward, fail and lose the stake. Built as a Telegram Mini App with React + Vite + Supabase, deployable to Vercel.

## 1. Prerequisites

* Node.js 18+ and npm
* A [Supabase](https://supabase.com) project (free tier is fine)
* A Telegram bot — create one with [@BotFather](https://t.me/BotFather) and grab its token
* A [Vercel](https://vercel.com) account (for deployment)

## 2. Local setup

```bash
npm install
cp .env.example .env.local
# Fill .env.local with your Supabase URL + anon key + service role key + bot token
```

### Create the database

Open the Supabase SQL Editor and run the contents of `supabase/schema.sql` once. This creates the `bets`, `user_profiles`, `community_bets`, `missions`, and `user_missions` tables with sensible RLS policies.

### Run the app

```bash
npm run dev
```

This starts Vite on `http://localhost:5173`. **API routes (`/api/*`) only run on Vercel**, so for fully-functional local development install the Vercel CLI and use `vercel dev` instead:

```bash
npm install -g vercel
vercel dev
```

For UI-only work outside Telegram, the app falls back to a `dev_mode` Telegram payload while in development. The serverless function will accept it if `ALLOW_DEV_LOGIN=true` is set or if `VERCEL_ENV !== production`.

## 3. Telegram Mini App auth

When a user opens the app inside Telegram, `window.Telegram.WebApp.initData` is sent to `/api/telegramAuth`. The serverless function:

1. Verifies the HMAC signature of `initData` using your `TELEGRAM_BOT_TOKEN`.
2. Derives a deterministic email/password (`tg_<id>@betly.app`).
3. Creates a Supabase auth user the first time, then signs the user in.
4. Returns access + refresh tokens, which the browser stores via `supabase.auth.setSession`.

All app data is fetched from Supabase using that session, with row-level security gating reads/writes by `user_email`.

## 4. Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, "New Project" → import the repo.
3. Set the following Environment Variables (Production + Preview):

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | from Supabase → Project Settings → API |
   | `VITE_SUPABASE_ANON_KEY` | from Supabase → Project Settings → API |
   | `SUPABASE_URL` | same as `VITE_SUPABASE_URL` |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → Project Settings → API (service_role) |
   | `TELEGRAM_BOT_TOKEN` | from @BotFather |
   | `TG_AUTH_SECRET` | any long random string |

4. Deploy. Vercel auto-detects Vite for the frontend and serves `api/*.js` as Node serverless functions.

## 5. Hooking up Telegram

In @BotFather:

* `/newapp` → choose your bot → set the web app URL to your Vercel domain (e.g. `https://betly.vercel.app`).
* Set a menu button or a `/start` deep link pointing to that web app.

When users press "Start", Telegram opens the Mini App, `initData` is sent to `/api/telegramAuth`, and they are auto-registered and signed in — no manual sign-up needed.

## 6. Project layout

```
api/                       # Vercel serverless functions
  _utils.js                # shared helpers (Supabase admin, HMAC verify)
  telegramAuth.js          # POST initData → Supabase session
  sendTelegramNotification.js
  handleInviteRef.js
src/
  api/
    supabaseClient.js      # browser Supabase client
    base44Client.js        # `db.*` adapter used across pages (auth/entities/functions)
  lib/                     # AuthContext, hooks, i18n, game config
  pages/                   # routed screens
  components/              # UI building blocks
supabase/
  schema.sql               # tables + RLS policies
vercel.json                # build + SPA rewrites
```

## 7. Notes on the changes vs. the original Base44 export

* The Base44 SDK was replaced with a Supabase adapter exposed under the same `db.auth` / `db.entities` / `db.functions` API, so page-level code did not need to be rewritten.
* Auth flow now uses Telegram WebApp `initData` → Supabase Auth (`signInWithPassword` + admin `createUser`) instead of the old Base44 OTP dance.
* Proof types are now restricted by category (Steps/km only available for Fitness), since the original UI offered tracker-based proofs even for non-fitness bets.
