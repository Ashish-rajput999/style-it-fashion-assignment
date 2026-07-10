# MeetingMind — Full Product Specification
## Styleit Fashion AI Meeting Management Platform

> **Working name:** MeetingMind (SIRUS-inspired branding throughout)  
> **Client:** Styleit Fashion Pvt Ltd  
> **Purpose:** SaaS platform that turns raw meeting recordings into compliance-ready, signed meeting-minutes reports for works councils / HR / compliance bodies (CSE, CSSCT, AG-type committees — starting with France).

---

## 0. Ground Truth

The client (a fashion company, "Styleit Fashion Pvt Ltd") is prototyping a SaaS product
that turns raw meeting recordings into compliance-ready, signed meeting-minutes reports for
works councils / HR / compliance bodies (CSE, CSSCT, AG-type committees — starting with France).

Two reference artifacts define the product:

1. **A reference product UI** ("SIRUS") showing: a stepper-based report creation wizard
   (region → compliance type → upload → processing → report), a report-analyzer compliance
   dashboard (score ring, risk cards, filterable findings table), and a rich text/report
   editor with a live word/char count and an "AI Assist" toolbar button.
2. **A reference report design system** (blue palette, page-based "book" layout) with
   reusable components: cover page with stat cards, key/value detail tables, executive
   summary cards, striped data tables, speaker discussion bubbles (color-coded by role),
   color-coded alert callouts (decision / unresolved / tension / projection), a vertical
   dotted timeline, and a vote block (question → date → result table → outcome).

---

## 1. Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript everywhere, strict mode on.
- **Styling:** Tailwind CSS + shadcn/ui as the component primitive layer, Framer Motion for micro-interactions/transitions.
- **State/data fetching:** Server Components + Server Actions for mutations; TanStack Query only where client-side reactivity is genuinely needed.
- **Database/ORM:** Prisma + SQLite for zero-config local dev (`file:./dev.db`).
- **Auth:** Auth.js (NextAuth) with credentials provider (email/password) for both client and admin; role field (`CLIENT` / `ADMIN`) gates routes via middleware.
- **Charts:** Recharts.
- **Rich text / document editor:** Tiptap (ProseMirror-based).
- **E-book / page-flip viewer:** Custom component (CSS 3D transform page-flip or `react-pageflip`).
- **File uploads:** local filesystem storage under `/uploads`.
- **Icons:** lucide-react. **Fonts:** Inter (UI) + Fraunces/Newsreader (report covers).
- **Package manager:** pnpm.

---

## 2. Repo Structure

```
meetingmind/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (marketing)/           # public site
      (auth)/                # sign up / login
      (client)/              # gated client app
      (admin)/               # gated admin panel
      api/                   # route handlers
    components/
      ui/                    # shadcn primitives
      ebook/                 # page-flip viewer + page templates
      report/                # report component library
      wizard/                # multi-step builder components
      admin/                 # admin-only components
      voice-agent/           # floating assistant widget
      charts/
    lib/
      providers/             # pluggable AI provider abstraction
        stt/  (mock.ts, deepgram.ts, index.ts)
        llm/  (mock.ts, openai.ts, deepseek.ts, gemini.ts, index.ts)
        tts/  (mock.ts, deepgram.ts, index.ts)
      compliance/            # region/compliance-type config
      report-schema.ts       # canonical JSON shape for a "report"
      auth.ts, db.ts, storage.ts
    styles/
      tokens.css             # design tokens
  public/
    demo-audio/              # 1–2 short sample meeting audio files
  README.md
```

---

## 3. Design System

### Product UI Palette
- `--brand-ink: #0F1226` (near-black navy — headings, primary buttons)
- `--brand-primary: #6D5DF6` (violet — primary actions, active states, focus rings)
- `--brand-primary-soft: #EEEBFF`
- `--brand-gold: #F6BF2F` (sparingly — premium tier accents only)
- `--surface: #F7F7FB`, `--surface-card: #FFFFFF`, `--border: #E7E7F2`
- Status: `--ok:#198C61 --warn:#B98313 --danger:#D94B4B --info:#7A5AF8`

### Report/Document Palette
- `--doc-accent:#2F69FF --doc-ink:#101936 --doc-muted:#9AA8C2 --doc-bg-tint:#F5F8FD`

### Non-Negotiable UI Moments
1. The **wizard stepper** with live breadcrumb and right-hand "Summary Report" mini-preview card
2. The **e-book page-flip viewer** (homepage, client preview, admin transcript, final report)
3. The **Report Analyzer dashboard** (compliance score radial gauge, risk/recommendation cards, filterable findings table)
4. The **admin Document Editor** — page-simulated canvas, floating toolbar, "AI Assist" button, live word/char counter
5. **Empty/loading states** for every async step

---

## 4. Provider Abstraction

```ts
interface STTProvider {
  transcribe(fileUrl: string): Promise<{ segments: { speaker: string; start: number; end: number; text: string }[] }>
}
interface LLMProvider {
  generate(prompt: string, context: string, schema: 'report' | 'analyzer' | 'speakers' | 'chart-data'): Promise<unknown>
}
interface TTSProvider {
  synthesize(text: string, lang: string): Promise<ArrayBuffer>
}
```

Default: `AI_PROVIDER=mock`. Real adapters: Deepgram, OpenAI, Gemini, DeepSeek.

---

## 5. Data Model (Prisma)

```prisma
model User         { id, email, passwordHash, role CLIENT|ADMIN, name, createdAt }
model ClientProfile{ id, userId, companyName, region, complianceType, notesFromAdmin, createdAt }
model MeetingRequest { id, clientProfileId, title, meetingDate, language, region, complianceType,
  tier ESSENTIAL|SCOPE|PREMIUM, status DRAFT|PREVIEWED|QUOTED|ADMIN_INTAKE|TRANSCRIBING|
       TRANSCRIBED|GENERATING|IN_EDITING|LOCKED|DISPATCHED,
  sourceFileUrl, createdAt, updatedAt }
model PreviewResult { id, meetingRequestId, speakerAnalysisJson, chartDataJson, complianceJson, createdAt }
model Transcript    { id, meetingRequestId, rawJson, editedJson, updatedAt }
model GeneratedOutput { id, meetingRequestId, type SPEAKER_ANALYSIS|REPORT_ANALYZER|NUMERICAL_DATA|
       MINUTES_REPORT|PPT_EXPORT, contentJson, locked Boolean, lockedAt, dispatchedAt }
model PromptTemplate { id, name, outputType, tier, promptText, updatedBy, updatedAt }
model VoiceKnowledgeEntry { id, question, answer, language }
model AuditLog { id, meetingRequestId, actorId, action, createdAt }
```

---

## 6. Report Component Library

Components under `components/report/`:
- `CoverPage`, `DocDetailsTable`, `NoticeSection`, `ExecSummaryCards`
- `AttendanceTable`, `SpeakerBubble` (role-colored: neutral/a/b)
- `AlertCallout` (decision/unresolved/tension/projection variants)
- `Timeline`, `VoteBlock`, `DataTable`, `PageChrome`

---

## 7. Client Screens

| # | Screen | Key behaviors |
|---|---|---|
| 0 | Homepage | Hero, Before/After split panel, sample report library (e-book) |
| 1 | Sign up / Login | Email+password, role=CLIENT |
| 2 | Wizard Step 1 | Region/country cards + compliance-type cards |
| 3 | Wizard Step 2 | Meeting metadata form + live breadcrumb + mini cover-preview |
| 4 | Wizard Step 3 | Drag-and-drop upload + file validation + upload progress |
| 5 | Processing screen | Animated multi-stage progress |
| 6 | Instant Preview | 3-pattern read-only e-book (watermarked) |
| 7 | Quotation form | Tier picker + comparison table + notes |
| 8 | Client dashboard | Past/active requests, e-book viewer, download button |
| 9 | Voice/text assistant | Bottom-right widget |

---

## 8. Admin Screens

| # | Screen | Key behaviors |
|---|---|---|
| 1 | Admin login | Separate from client login |
| 2 | Queue / dashboard | Kanban-ish MeetingRequest columns |
| 3 | Client folder view | Cover-label summary, file player, status timeline, tabs |
| 4 | Transcription trigger | STT provider → e-book with inline editing |
| 5 | Generation | Tier-aware output type panel with checkboxes |
| 6 | Prompt library manager | CRUD UI for PromptTemplate |
| 7 | Document editor | Tiptap page-canvas, formatting toolbar, AI Assist, word/char counter |
| 8 | Report Analyzer builder | Interactive compliance dashboard |
| 9 | Lock & Dispatch | Lock + dispatch to client |
| 10 | Customer profile / CRM-lite | ClientProfile detail, history, notes |

---

## 9. Tier Logic

| Feature | Essential | Scope | Premium |
|---|---|---|---|
| Transcription | single channel | + speaker diarization | + multi-language |
| Formatting | chronological summary | agenda-based | agenda-based + formal legal layout |
| Compliance check | basic keyword | full audit | full audit + clause-by-clause notes |
| Editing | speaker names only | full text+speaker | full + human reviewer pass |
| Voting log | — | auto detect+tabulate | auto detect + signature-ready |
| Outputs | PDF | PDF+DOCX | PDF+DOCX+letterhead |
| Sign-off | — | digital sign-off block | + audit trail/certificate |

---

## 10. Compliance/Region Config

France/CSE fully functional. Others "Coming Soon":
- CSE (Comité Social et Économique) — active
- AG (Accountability and Governance) — coming soon
- CSSCT — coming soon
- CSEE — coming soon
- QVCT — coming soon

Countries: France (active), Germany, Spain, Italy, UK, Switzerland (all coming soon)

---

## 11. Build Order

1. **Scaffold** — Next.js + TS + Tailwind + Prisma/SQLite + Auth.js wired up, design tokens in place, empty route groups ✅
2. **Design system + report component library**
3. **Provider abstraction + seed script**
4. **Auth + client wizard**
5. **Instant preview + e-book viewer**
6. **Quotation + client dashboard**
7. **Admin queue + client folder + transcription**
8. **Prompt library + generation + Document Editor + Report Analyzer**
9. **Lock/Dispatch + CRM-lite**
10. **Voice/text assistant widget**
11. **Homepage + marketing polish**
12. **PDF/DOCX export**
13. **Empty/loading/error states, responsive, accessibility**
14. **README**

---

## 12. Acceptance Checklist

- [ ] `pnpm install && pnpm dev` works with zero manual env setup
- [ ] Visitor can open homepage, flip through sample report, no login
- [ ] New client can sign up, complete wizard, upload, see 3-pattern preview
- [ ] Quotation flow creates request visible in admin queue
- [ ] Admin can run transcription, edit speaker, generate outputs, edit in Document Editor, lock, dispatch
- [ ] Client dashboard shows dispatched report, viewable + downloadable
- [ ] Report Analyzer renders real numbers from mock LLM analysis
- [ ] Voice assistant answers 3+ seeded FAQ questions
- [ ] No unstyled form elements. No layout shift. No console errors.
- [ ] README lets a stranger run demo in under 5 minutes.

---

## 13. Tone

Favor fewer screens done beautifully over more screens done roughly.
When in doubt on a visual decision, prefer the more refined, more restrained option.
