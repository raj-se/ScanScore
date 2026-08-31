# ScanScore — Resume ATS Score Checker

Upload a resume + a job description → get an instant ATS compatibility score,
keyword gaps, formatting risk report, and actionable suggestions. First 2
suggestions are free; the full report unlocks via a **demo checkout** (no real
payment processor — see note below). Also surfaces live job openings ranked
by fit to the resume, which unlock alongside the full report.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Framer Motion** for animation
- **Zod** for request validation
- **Google Gemini API** (free tier — `gemini-3.6-flash`) for ATS scoring + suggestion generation
- **Adzuna API** for live job listings
- `pdf-parse` / `mammoth` for resume text extraction (PDF / DOCX)

No database is required for the MVP — see "How the unlock flow works" below.

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (free, no billing required) |
| `ANALYSIS_SECRET` | Any random 32+ char string — run `openssl rand -hex 32` |
| `NEXT_PUBLIC_FULL_REPORT_PRICE_DISPLAY` | Cosmetic only — shown on the unlock button/modal |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | https://developer.adzuna.com (free tier, instant signup) |

Job search gracefully degrades (with a clear in-app message) if its keys are
missing, so you can develop the core scoring flow first.

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 4. ⚠️ Payment is a demo, not real

There is **no payment processor wired up**. `components/PaymentModal.tsx`
shows a card-style form (card number, name, expiry, CVV) purely for show:

- Card number: any 12–19 digits.
- Expiry: must be a real month and this month or later (MM/YY).
- CVV: any 3–4 digits.
- Nothing is sent to a card network, validated as a real card, or stored
  anywhere — the values are only used for client-side form validation.

On "Pay", it shows a short processing spinner, then a success animation,
then calls `/api/unlock` to fetch the full report — **no payment check
happens server-side either**. This is intentionally a placeholder so you can
demo/build the rest of the product before integrating a real processor
(Razorpay, Stripe, etc.).

**Before taking real money**, replace the body of `app/api/unlock/route.ts`
with: create an order/session with your processor, redirect or open its
real checkout, verify the payment server-side (signature or webhook), and
only then decrypt `lockedPayload`.

## 5. How the unlock flow works (no database needed)

1. `/api/analyze` calls Gemini, gets the **full** analysis, then:
   - Sends the client only the free preview (2 suggestions, 3 missing keywords, no formatting report).
   - Encrypts the **full** analysis (AES-256-GCM, server-only `ANALYSIS_SECRET`) and sends that as an opaque `lockedPayload` string the client cannot read.
2. The client hangs onto `lockedPayload` and shows the demo checkout modal.
3. Once the demo form "succeeds", the client calls `/api/unlock`, which decrypts `lockedPayload` and returns the full result — this also unlocks the live jobs section below the report.

This means the paid content is never present in a readable form on the client
until `/api/unlock` is called — without needing Postgres/Mongo for the MVP.
It does **not** mean the content is protected from someone who unlocks it for
free, since there's no real payment gate yet (see section 4).

**For production**, you'll likely want a real database anyway (to store
users, past scans, and payment records, and to support "my scan history").
The natural next step: create an `analyses` table (Postgres via
[Neon](https://neon.tech) or [Supabase](https://supabase.com), both have
generous free tiers that pair well with Vercel), store the full result there
keyed by `analysisId`, and flip a `paid` boolean in `/api/unlock` after a
real payment check, instead of using the encryption trick.

## 6. Deploy to Vercel (free plan)

1. Push this project to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Add all the environment variables from `.env.local` in the Vercel project's
   **Settings → Environment Variables**.
4. Deploy. Vercel's free plan covers this comfortably — the only limits to
   watch are the 10s default function duration (already raised to 60s for
   `/api/analyze` via `maxDuration`, which needs a Vercel Pro plan for >10s;
   on the free/Hobby plan, lower `maxDuration` in
   `app/api/analyze/route.ts` back to 10 if you hit timeouts on large resumes).
5. Once you buy a domain, add it under **Settings → Domains** — no code
   changes needed.

## Project structure

```
app/
  page.tsx              — single-page flow: upload → scan → results → demo checkout → jobs
  layout.tsx            — fonts, metadata
  api/
    analyze/route.ts        — resume+JD → Gemini → free preview + locked payload
    unlock/route.ts          — decrypts locked payload (NO real payment check — see section 4)
    jobs/route.ts            — Adzuna search, computes match % per listing
components/              — all UI pieces (upload, gauge, suggestions, paywall, payment modal, jobs…)
lib/                     — extractText, gemini (Gemini call), crypto, schemas
types/                   — shared TypeScript types
```

## Ideas for v2 (not built yet)

- Wire up a real payment processor (see section 4) before taking real money.
- Persist scans in Postgres so users can revisit past reports.
- Auth (magic link) so "my scans" works across devices.
- Weekly digest email of new matching jobs for a saved resume.
- Support LinkedIn job data alongside Adzuna.
