# MeetingMind 🎙️🤖

An enterprise-grade, compliance-first minutes generator and audit portal designed specifically for French Social and Economic Committee (CSE) meetings. MeetingMind converts raw audio/video recordings into structured, legally compliant minutes and exports them to print-ready PDF and DOCX formats.

---

## 🚀 Quick Start (Local Setup)

Setup is completely automated. Zero manual database installation, configuration, or external accounts are required to get the full sandbox environment running locally.

### 1. Install dependencies
From the project root directory, run:
```bash
pnpm install
```

### 2. Configure Environment variables
Copy the template configuration file to `.env`:
```bash
cp .env.example .env
```
*(No edits are needed in `.env` for standard local execution—it defaults to the local SQLite sandboxed configuration).*

### 3. Initialize & Seed Database
Reset the SQLite database, apply the schema, and seed the default user accounts and template reports:
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### 4. Start Development Server
Boot up the Next.js development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏛️ Architecture Overview

MeetingMind is built on Next.js 15 (App Router) with Prisma ORM and SQLite.

```
                  ┌───────────────────────────────────────────────┐
                  │                 Next.js UI                    │
                  │   (src/app/page.tsx, components/marketing/)   │
                  └───────────────┬───────────────┬───────────────┘
                                  │               │
      ┌───────────────────────────▼───┐       ┌───▼───────────────────────────┐
      │       Client Portal           │       │         Admin Portal          │
      │    (src/app/(client)/)        │       │      (src/app/(admin)/)       │
      │                               │       │                               │
      │ ─ Dashboard & Stats           │       │ ─ Kanban Request Queue        │
      │ ─ Wizard (Upload / Quote)     │       │ ─ Transcription Workbench     │
      │ ─ Interactive BookViewer      │       │ ─ LLM generation cockpit      │
      │ ─ Voice Assistant Widget      │       │ ─ Prompt Template Editor      │
      └───────────────┬───────────────┘       └───┬───────────────────────────┘
                      │                           │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Service Abstractions   │
                      │      (src/lib/auth)       │
                      │      (src/lib/db)         │
                      │      (src/lib/storage)    │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Provider Adapter       │
                      │   (src/lib/providers/)    │
                      └─────┬───────────────┬─────┘
                            │               │
             ┌──────────────▼──────┐ ┌──────▼──────────────┐
             │   Mock Sandbox      │ │   Live Providers    │
             │   (Default)         │ │  (Deepgram/OpenAI/  │
             │                     │ │   Gemini/DeepSeek)  │
             └─────────────────────┘ └─────────────────────┘
```

### Key Directories
*   `src/app/(client)/` — Portal and Wizard wizard flow for meeting clients.
*   `src/app/(admin)/` — Board request pipelines, transcripts editing, prompt configurations, and audit reports dispatch cockpit.
*   `src/app/export/` & `/api/export/` — PDF & DOCX streaming endpoints.
*   `src/components/report/` — Shared react components (CoverPage, AttendanceTable, SpeakerBubble, AlertCallout, Timeline, PageChrome) for both on-screen BookViewer rendering and server-side PDF Puppeteer printing.
*   `src/components/voice-agent/` — Client portal interactive floating voice assistant.
*   `src/lib/providers/` — Adapter interfaces (`types.ts`) and custom modules.
*   `prisma/` — Schema definition (`schema.prisma`) and initial database seeding script (`seed.ts`).

---

## 🤖 What's Mocked vs. Production-Ready

By default, MeetingMind runs in a **Sandbox Mock Mode** so developers can inspect and audit LLM, STT, and TTS capabilities without requiring subscription API keys.

| Service | Sandboxed Mock Mode (Default) | Production-Ready Swappable Provider |
| :--- | :--- | :--- |
| **STT** (Speech-to-Text) | `MockSTTProvider` (simulates transcripts processing) | `DeepgramSTTProvider` (real-time audio upload processing) |
| **LLM** (Compliance Minutes) | `MockLLMProvider` (returns seeded report templates) | `OpenAILLMProvider`, `GeminiLLMProvider`, `DeepSeekLLMProvider` |
| **TTS** (Voice Assistant) | SpeechSynthesis API / Mock | `DeepgramTTSProvider` |

### swappable Live configuration
To go live, change the config variables in your `.env` file:
```env
# Choose provider keys
STT_PROVIDER=deepgram
LLM_PROVIDER=openai  # or gemini, deepseek
TTS_PROVIDER=deepgram

# Provide actual keys
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

---

## 🎬 Step-by-Step Demo Script (5-10 Minutes Presentation)

### Step 1: The Marketing Homepage (Zero Auth)
1. Navigate to `http://localhost:3000` (incognito browser recommended).
2. Show the Hero section and Before/After comparison panels outlining AI vs Manual minute creation.
3. Scroll to the **Sample Report Library**.
4. Open the **PREMIUM** sample report. Flip through the pages in the **BookViewer** modal, showing the "SAMPLE REPORT" watermark.
5. Click **Download PDF** and **Download DOCX** in the modal top bar, showing successful downloads with clean corporate filenames. Close modal.
6. Open the **ESSENTIAL** report card modal and verify *only* the PDF option is available.

### Step 2: Client Signup & Wizard Flow
1. Click **Get Started** in the top header.
2. Sign up with a new email, or click **Client Login** and log in with default seeded credentials:
   * **Client Login:** `client1@meetingmind.com` / `password123`
3. In the Client Portal dashboard, click **Launch Creation Wizard**.
4. **Step 1 (Region & Compliance):** Select **France** and **CSE**. Click Continue.
5. **Step 2 (Meeting Details):** Fill in name, location, select meeting type, and choose a date. Click Continue.
6. **Step 3 (Tier Selection):** Choose **Premium**.
7. **Step 4 (Upload Audio):** Drag and drop or upload any test audio/video file. Click **Upload and Process**. Show the custom loading states.
8. **Step 5 (Proposal Review):** Review the generated quotation proposal. Click **Accept & Submit Request**.
9. The request is now placed in the Client Dashboard as `Awaiting Operation Delivery`.

### Step 3: Admin Review, Generation, and Dispatch
1. Click **Sign Out** in the dashboard header.
2. Click **Client Login** (leads to login) and log in with default seeded admin credentials:
   * **Admin Login:** `admin@meetingmind.com` / `password123`
3. Inspect the **Kanban Requests Board**. Your newly submitted request is in the `ADMIN_INTAKE` column.
4. Click on your request card to enter the **Request Folder**.
5. Click **Transcribe Audio** to convert the audio to text.
6. Click **Generate Compliance Minutes** to trigger the LLM agent review.
7. Click the **Minutes Editor** tab. Modify any text in the transcript or summaries. Click **Lock Output for Dispatch**.
8. In the header, click **Dispatch to Client**. The status updates to `DISPATCHED`.

### Step 4: Client Verification & Voice Assistant
1. Sign out of the Admin Portal and log back in as `client1@meetingmind.com`.
2. Locate the report under **Delivered Reports**.
3. Open the report in the BookViewer, showing the watermark now reads **"PREVIEW — NOT FOR DISTRIBUTION"**.
4. Test the **Voice Assistant Widget** (floating icon at bottom right):
   * Expand the widget and click the Microphone button (visual listening state).
   * Type or speak: *"What retraining packages were decided?"* or *"Was a quorum met?"*.
   * Verify the widget searches seeded `VoiceKnowledgeEntry` data and returns accurate French compliance citations.

---

## 🚫 Known Scope Boundaries (Intentional Scoping Decisions)

1.  **Simulated Payment Gateways:** Stripe integration is simulated. In production, the "Quotation Review" screen connects to a standard payment collection gateway.
2.  **No Real Email Transports:** Notification dispatch triggers are logged locally to the console instead of sending real SMTP emails.
3.  **Regional Scope:** Standardized specifically for French CSE boards. Additional compliance schemas (e.g., German BetrVG) are logically modeled in `regions.ts` but scoped out of active templates.
