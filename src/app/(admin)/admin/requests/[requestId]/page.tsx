import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { CoverPage } from '@/components/report/CoverPage'
import { TranscriptEditor } from './TranscriptEditor'
import { GenerationPanel } from './GenerationPanel'
import type { Segment } from './TranscriptEditor'

interface RequestPageProps {
  params: Promise<{ requestId: string }>
  searchParams: Promise<{ tab?: string }>
}

// Status pipeline with labels, descriptions and indicators
const STATUS_PIPELINE = [
  { status: 'QUOTED', label: 'Quotation Received', icon: '📥' },
  { status: 'ADMIN_INTAKE', label: 'Admin Intake', icon: '🗂️' },
  { status: 'TRANSCRIBING', label: 'Transcribing', icon: '🎙️' },
  { status: 'TRANSCRIBED', label: 'Transcribed', icon: '📝' },
  { status: 'GENERATING', label: 'Generating Outputs', icon: '⚙️' },
  { status: 'IN_EDITING', label: 'Document Editing', icon: '✏️' },
  { status: 'LOCKED', label: 'Locked for Review', icon: '🔒' },
  { status: 'DISPATCHED', label: 'Delivered to Client', icon: '✅' },
]

const STATUS_ORDER = STATUS_PIPELINE.map((s) => s.status)

const TIER_LABELS: Record<string, string> = {
  ESSENTIAL: 'Essential',
  SCOPE: 'Scope',
  PREMIUM: 'Premium',
}

function formatDate(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function isAudioFile(url: string | null) {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase()
  return ['mp3', 'wav', 'ogg', 'mp4', 'm4a', 'webm'].includes(ext ?? '')
}

function isVideoFile(url: string | null) {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase()
  return ['mp4', 'webm', 'mov', 'avi'].includes(ext ?? '')
}

export default async function RequestDetailPage({ params, searchParams }: RequestPageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const { requestId } = await params
  const { tab = 'transcript' } = await searchParams

  const meeting = await db.meetingRequest.findUnique({
    where: { id: requestId },
    include: {
      clientProfile: { include: { user: true } },
      transcript: true,
      generatedOutputs: true,
      auditLogs: {
        orderBy: { createdAt: 'asc' },
        take: 20,
      },
    },
  })

  if (!meeting) notFound()

  const profile = meeting.clientProfile
  const user = profile.user

  // Parse transcript (editedJson preferred for display if present, raw as fallback)
  let segments: Segment[] | null = null
  const hasSavedEdits = !!meeting.transcript?.editedJson
  if (meeting.transcript) {
    const raw = hasSavedEdits
      ? meeting.transcript.editedJson!
      : meeting.transcript.rawJson
    try {
      segments = JSON.parse(raw)
    } catch {}
  }

  // Current step index in pipeline
  const currentIdx = STATUS_ORDER.indexOf(meeting.status)

  // Cover page mock meta from meeting data
  const coverMeta = {
    title: meeting.title,
    company: profile.companyName,
    date: formatDate(meeting.meetingDate),
    location: meeting.location ?? 'Non précisé',
    meetingType: meeting.meetingType ?? 'Ordinary',
    complianceType: meeting.complianceType,
    region: meeting.region,
    preparedBy: 'MeetingMind System',
    reference: `REF-${meeting.id.slice(-6).toUpperCase()}`,
    language: meeting.language ?? 'fr',
  }
  const coverStats = {
    attendees: segments?.length ? new Set(segments.map((s) => s.speaker)).size : 0,
    duration: segments?.length
      ? `${Math.round((segments[segments.length - 1]?.end ?? 0) / 60)} min`
      : '—',
    decisions: meeting.generatedOutputs.length,
    actionItems: 0,
  }

  const activeTab = ['transcript', 'generate', 'outputs', 'notes'].includes(tab) ? tab : 'transcript'

  // Serialise outputs for GenerationPanel
  const serialisedOutputs = meeting.generatedOutputs.map(o => ({
    id: o.id,
    type: o.type,
    contentJson: o.contentJson,
    locked: o.locked,
    createdAt: o.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[#0F1226] text-white flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="border-b border-white/10 px-6 md:px-10 py-4 flex items-center gap-4">
        <Link
          href="/admin"
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
        >
          ←
        </Link>
        <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-extrabold text-sm shadow">
          M
        </div>
        <div>
          <h1 className="font-extrabold text-sm leading-none line-clamp-1">{meeting.title}</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            {profile.companyName} · {user.email}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span
            className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full ${
              meeting.tier === 'PREMIUM'
                ? 'bg-amber-400/20 text-amber-300'
                : meeting.tier === 'SCOPE'
                ? 'bg-indigo-400/20 text-indigo-300'
                : 'bg-violet-400/20 text-violet-300'
            }`}
          >
            {TIER_LABELS[meeting.tier] ?? meeting.tier}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full bg-white/10 text-gray-300">
            {meeting.status.replace(/_/g, ' ')}
          </span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 overflow-hidden">

        {/* LEFT SIDEBAR — Cover summary + timeline + file player */}
        <aside className="border-r border-white/10 overflow-y-auto p-5 space-y-5 bg-[#0b0f1e]">

          {/* Cover preview (white card so the component reads naturally) */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Cover Summary</p>
            <div className="bg-white rounded-xl overflow-hidden shadow-xl text-[var(--doc-ink)]" style={{ fontSize: '0.7rem' }}>
              <CoverPage
                meta={coverMeta}
                stats={coverStats}
                attendees={[]}
              />
            </div>
          </section>

          {/* Source file player */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Source File</p>
            {meeting.sourceFileUrl ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-[10px] text-gray-400 truncate font-mono">
                  {meeting.sourceFileUrl.split('/').pop()}
                </p>
                {isAudioFile(meeting.sourceFileUrl) || !isVideoFile(meeting.sourceFileUrl) ? (
                  <audio
                    controls
                    src={meeting.sourceFileUrl}
                    className="w-full h-9 rounded-lg"
                    preload="metadata"
                  />
                ) : (
                  <video
                    controls
                    src={meeting.sourceFileUrl}
                    className="w-full rounded-lg max-h-40"
                    preload="metadata"
                  />
                )}
                <a
                  href={meeting.sourceFileUrl}
                  download
                  className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  ↓ Download original file
                </a>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-xs">No file uploaded</p>
              </div>
            )}
          </section>

          {/* Status timeline */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Status Timeline</p>
            <div className="space-y-0">
              {STATUS_PIPELINE.map((step, idx) => {
                const isPast = idx < currentIdx
                const isCurrent = idx === currentIdx
                const isFuture = idx > currentIdx
                const isLast = idx === STATUS_PIPELINE.length - 1

                return (
                  <div key={step.status} className="flex items-start gap-3">
                    {/* Node + connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                          isCurrent
                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110'
                            : isPast
                            ? 'border-emerald-500 bg-emerald-600 text-white'
                            : 'border-white/15 bg-white/5 text-gray-600'
                        }`}
                      >
                        {isPast ? '✓' : step.icon}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-6 my-0.5 rounded-full ${
                            isPast ? 'bg-emerald-500/50' : 'bg-white/10'
                          }`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pt-1 pb-5">
                      <p
                        className={`text-[11px] font-bold leading-none ${
                          isCurrent
                            ? 'text-indigo-400'
                            : isPast
                            ? 'text-emerald-400'
                            : 'text-gray-600'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                          ← Current
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Client info card */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Client Info</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-white font-bold">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-indigo-300 font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Company</span>
                <span className="text-white font-medium">{profile.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-white font-medium">{meeting.region} / {meeting.complianceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Meeting date</span>
                <span className="text-white font-medium text-right">
                  {meeting.meetingDate?.toLocaleDateString('fr-FR') ?? '—'}
                </span>
              </div>
            </div>
          </section>
        </aside>

        {/* RIGHT PANEL — Tab content */}
        <div className="flex flex-col overflow-hidden bg-[#0F1226]">

          {/* Tab bar */}
          <div className="border-b border-white/10 px-6 pt-4 flex items-center gap-1">
            {[
              { id: 'transcript', label: 'Transcript', icon: '🎙️' },
              { id: 'generate', label: 'Generate', icon: '⚡' },
              { id: 'outputs', label: 'Outputs', icon: '📄' },
              { id: 'notes', label: 'Client Notes', icon: '💬' },
            ].map((t) => (
              <Link
                key={t.id}
                href={`/admin/requests/${requestId}?tab=${t.id}`}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </Link>
            ))}
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-auto p-6">

            {/* TRANSCRIPT TAB */}
            {activeTab === 'transcript' && (
              <TranscriptEditor
                requestId={requestId}
                initialSegments={segments}
                hasSourceFile={!!meeting.sourceFileUrl}
                hasSavedEdits={hasSavedEdits}
              />
            )}

            {/* GENERATE TAB */}
            {activeTab === 'generate' && (
              <GenerationPanel
                requestId={requestId}
                tier={meeting.tier}
                hasTranscript={!!meeting.transcript}
                existingOutputs={serialisedOutputs}
              />
            )}

            {/* OUTPUTS TAB */}
            {activeTab === 'outputs' && (
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Generated Outputs</h3>
                {meeting.generatedOutputs.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-gray-500 text-sm">No outputs generated yet.</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Outputs will appear here after the Generation step (Phase 8).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meeting.generatedOutputs.map((output) => (
                      <div
                        key={output.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                            {output.type.replace(/_/g, ' ')}
                          </span>
                          <p className="text-white font-bold text-sm mt-0.5">
                            {output.type === 'MINUTES_REPORT' ? 'Meeting Minutes' : output.type}
                          </p>
                          <p className="text-gray-500 text-[10px] mt-1">
                            Created {new Date(output.createdAt).toLocaleDateString('fr-FR')}
                            {output.locked && ' · 🔒 Locked'}
                            {output.dispatchedAt && ' · ✅ Dispatched'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {output.locked && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                              Locked
                            </span>
                          )}
                          {output.dispatchedAt && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              Dispatched
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Client Notes & Instructions</h3>
                {meeting.notes ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Client message (from quotation form)
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {meeting.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-gray-500 text-sm">No client notes submitted.</p>
                    <p className="text-gray-600 text-xs mt-1">
                      The client did not add any additional instructions in their quotation form.
                    </p>
                  </div>
                )}

                {/* Admin notes field — for future use */}
                {profile.notesFromAdmin && (
                  <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-3">
                      Admin notes (internal)
                    </p>
                    <p className="text-sm text-indigo-200 leading-relaxed">
                      {profile.notesFromAdmin}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
