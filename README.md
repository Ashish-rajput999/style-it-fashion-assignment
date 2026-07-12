# MeetingMind 🎙️🤖

> **Enterprise-grade, compliance-first meeting minutes for French CSE / Works Councils.**  
> Upload raw audio/video → AI transcription → structured compliance report → PDF + DOCX export.

---

## 🚀 Quick Start (2 commands after clone)

No database server, no cloud account, no manual configuration required.

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template (defaults work out of the box)
cp .env.example .env

# 3. Bootstrap database + generate Prisma client + seed demo data — single command
pnpm setup

# 4. Start development server
pnpm dev
```

Open http://localhost:3000

> **What `pnpm setup` does internally:**  
> `prisma db push --force-reset` → `prisma generate` → `prisma db seed`  
> This sequence is required because `db push` does **not** auto-generate the Prisma Client.  
> Running `seed` before `generate` causes a `MODULE_NOT_FOUND` crash — the setup script  
> eliminates this for anyone cloning fresh.

### Demo credentials (pre-seeded)

| Role | Email | Password |
|------|-------|----------|
| **Client** | `client1@meetingmind.com` | `password123` |
| **Admin** | `admin@meetingmind.com` | `password123` |

---

## 🏛️ Architecture

MeetingMind is a **Next.js 16 App Router** monolith with SQLite (Prisma) and a provider abstraction layer for every AI service.

```
                    ┌─────────────────────────────────────┐
                    │         Marketing Homepage          │
                    │         src/app/page.tsx            │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
│  Client Portal  │    │   Admin Portal       │    │   Export Routes    │
│(app/(client)/)  │    │  (app/(admin)/)      │    │ (app/api/export/)  │
│                 │    │                      │    │                    │
│ • Dashboard     │    │ • Kanban queue       │    │ /pdf/[outputId]    │
│ • 6-step Wizard │    │ • Request folder     │    │ /docx/[outputId]   │
│ • BookViewer    │    │ • Transcript editor  │    │ /render/[outputId] │
│ • Voice Widget  │    │ • Generation panel   │    └────────────────────┘
└────────┬────────┘    │ • Prompt library     │
         │             └──────────┬───────────┘
         └──────────────┬─────────┘
                        │
                        ▼
          ┌─────────────────────────────┐
          │      Provider Layer         │
          │   src/lib/providers/        │
          │                             │
          │  STT:  Mock | Deepgram      │
          │  LLM:  Mock | OpenAI        │
          │               | Gemini      │
          │               | DeepSeek    │
          │  TTS:  Mock | Deepgram      │
          └──────────┬──────────────────┘
                     │
                     ▼
          ┌─────────────────────────────┐
          │    Prisma ORM + SQLite      │
          │         dev.db              │
          │  (swap DATABASE_URL for    │
          │   Postgres in production)  │
          └─────────────────────────────┘
```

### Key directories

```
src/
├── app/
│   ├── (client)/          # Client portal: dashboard, wizard, preview
│   ├── (admin)/           # Admin portal: queue, request folder, prompts
│   ├── (auth)/            # Login / signup pages
│   ├── api/               # Route handlers (wizard, export, transcribe, assistant)
│   ├── export/render/     # Secret-gated HTML render page used by Puppeteer PDF
│   └── globals.css        # Full design system (tokens, components, @media print)
│
├── components/
│   ├── ebook/             # BookViewer — animated double-page flip reader
│   ├── marketing/         # Homepage sections
│   ├── report/            # Shared report components used by BookViewer AND PDF
│   └── voice-agent/       # Floating voice assistant widget
│
├── lib/
│   ├── providers/
│   │   ├── llm/           # mock + openai + gemini + deepseek adapters
│   │   ├── stt/           # mock + deepgram adapters
│   │   └── tts/           # mock + deepgram adapters
│   ├── auth.ts            # NextAuth v5 config
│   ├── db.ts              # Prisma singleton
│   ├── report-schema.ts   # MinutesReport Zod schema
│   ├── storage.ts         # Local file storage
│   └── tiers.ts           # ESSENTIAL / SCOPE / PREMIUM feature definitions
│
└── proxy.ts               # Edge middleware (auth + role routing)

prisma/
├── schema.prisma          # Data model
└── seed.ts                # Demo users, 3 dispatched reports, prompts, voice FAQs
```

---

## 🤖 Mocked vs. Production-Ready

By default every AI service runs in **sandbox mock mode** — no API keys needed.

| Service | Default (mock) | Live provider |
|---------|----------------|---------------|
| **STT** — Speech-to-Text | `MockSTTProvider` — seeded transcript JSON | `DeepgramSTTProvider` |
| **LLM** — Report generation | `MockLLMProvider` — seeded `MinutesReport` | `OpenAILLMProvider` / `GeminiLLMProvider` / `DeepSeekLLMProvider` |
| **TTS** — Voice assistant | Browser `SpeechSynthesis` API | `DeepgramTTSProvider` |
| **PDF export** | Puppeteer + Chromium ✅ real | Same — production-grade |
| **DOCX export** | `docx` library ✅ real | Same — production-grade |
| **Auth** | NextAuth + bcrypt ✅ real | Same |
| **Storage** | Local disk (`public/uploads/`) | Swap `storage.ts` for S3/GCS |
| **Database** | SQLite (`dev.db`) | Change `DATABASE_URL` → Postgres |

### Swapping in live AI credentials

Edit `.env`:

```env
# STT
STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=dg_xxxxxxxxxxxxxxxxxxxx

# LLM — pick one
LLM_PROVIDER=openai           # or: gemini | deepseek
OPENAI_API_KEY=sk-xxxxxxxxxxxx
GEMINI_API_KEY=AIzaSy_xxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx

# TTS (uses same Deepgram key)
TTS_PROVIDER=deepgram
```

The provider index files (`src/lib/providers/*/index.ts`) read these env vars and return the correct adapter — no code changes needed.

---

## 🎬 Demo Script (5–10 minutes)

### Act 1 — Marketing & Sample Reports (2 min)

1. Open **http://localhost:3000** in incognito.
2. Point out hero section, Before/After compliance comparison panels.
3. Scroll to **Sample Report Library** — three tier cards.
4. Click **Open Sample Report** on **Premium** card.
   - BookViewer modal opens with animated page-flip and "SAMPLE REPORT" watermark.
   - Flip through: Cover → Attendance table → Speaker bubbles → Alert callouts → Vote blocks.
   - Click **📥 Download PDF** → real ~750 KB A4 PDF downloads with a corporate filename.
   - Click **📝 Download DOCX** → real Word document downloads.
5. Close modal. Open **Essential** card — only PDF button visible (DOCX is tier-gated).

### Act 2 — Client Signup & Wizard (3 min)

6. **Client Login:** `client1@meetingmind.com` / `password123`
7. Note dashboard stats bar (Total, Active, Delivered, Avg Compliance %).
8. Click **+ Launch Creation Wizard**.
9. **Region:** France / CSE → Continue.
10. **Details:** Fill name, location, type, date → Continue.
11. **Tier:** Choose Premium → Continue.
12. **Upload:** Drop any audio/video/PDF file → progress bar fills → auto-advances.
13. **Quote:** Review pricing proposal → **Accept & Submit**.
14. Dashboard shows request card as `Awaiting Operation Delivery`.

### Act 3 — Admin Pipeline (3 min)

15. Sign out → Login as `admin@meetingmind.com` / `password123`
16. **Admin Queue** — Kanban board. New request in first column. Demo search/filter bar.
17. Click request card → **Request Folder** opens (sidebar: cover preview + audio player).
18. **Transcript tab** → **🎙️ Transcribe Audio** → status updates to `TRANSCRIBED`.
19. **Generate tab** → **⚙️ Generate Compliance Minutes** → `IN_EDITING`.
20. **Editor tab** → Edit a sentence → **Save** → **🔒 Lock Output**.
21. Header → **Dispatch to Client** → `DISPATCHED`. ✅

### Act 4 — Client Delivery & Voice Assistant (2 min)

22. Sign out → Login as `client1@meetingmind.com`.
23. Dashboard: request card now in **Delivered Reports** with green badge.
24. **Open Report Viewer** → ReportBook full-screen (no watermark on client view).
    - **📥 Download PDF** → A4 PDF streams and downloads.
25. **Voice Assistant** (floating 🎙️ icon, bottom-right):
    - Ask: *"What retraining packages were decided?"* → cited answer from knowledge base.
    - Ask: *"Was quorum reached?"* → another knowledge-base hit.

---

## ⚠️ Known Scope Boundaries

Deliberate scoping decisions for a time-boxed assignment, not bugs:

| Item | Decision |
|------|----------|
| **Payment processing** | Quotation acceptance is a UI step only — no Stripe/PayPal. |
| **Email notifications** | Status change emails are console-logged, not sent over SMTP. |
| **Additional regions** | France CSE only. Germany BetrVG and Spain LOLS are modelled in `regions.ts` but `active: false`. |
| **Multi-tenancy** | One admin role, single organization — no tenant isolation. |
| **File storage** | Files land in `public/uploads/` on local disk — no S3/GCS. |
| **Real-time updates** | Status changes require a page refresh — no WebSocket/SSE. |
| **PDF font embedding** | Google Fonts load from CDN in the Puppeteer render page — offline environments need local font embedding. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Vanilla CSS design system + Tailwind 4 utilities |
| Auth | NextAuth v5 (Credentials + Prisma adapter) |
| Database | SQLite via `better-sqlite3` + Prisma 7 |
| Animation | Framer Motion (page-flip book, micro-animations) |
| Rich Text | TipTap v3 (transcript editor) |
| PDF | Puppeteer 25 (headless Chrome → A4 PDF) |
| DOCX | `docx` v9 (programmatic Word generation) |
| STT | Deepgram (+ mock adapter) |
| LLM | OpenAI / Gemini / DeepSeek (+ mock adapter) |
| Charts | Recharts (compliance score gauges) |
