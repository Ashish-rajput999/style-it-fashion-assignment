import React from 'react'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { MinutesReport } from '@/lib/report-schema'
import { CoverPage } from '@/components/report/CoverPage'
import { AttendanceTable } from '@/components/report/AttendanceTable'
import { ExecSummaryCards } from '@/components/report/ExecSummaryCards'
import { SpeakerBubble } from '@/components/report/SpeakerBubble'
import { AlertCallout } from '@/components/report/AlertCallout'
import { Timeline } from '@/components/report/Timeline'
import { VoteBlock } from '@/components/report/VoteBlock'
import { PageChrome } from '@/components/report/PageChrome'

export const dynamic = 'force-dynamic'

interface RenderPageProps {
  params: Promise<{ outputId: string }>
  searchParams: Promise<{ secret?: string }>
}

export default async function RenderPage({ params, searchParams }: RenderPageProps) {
  const { outputId } = await params
  const { secret } = await searchParams

  const expectedSecret = process.env.NEXTAUTH_SECRET || 'secret'
  if (secret !== expectedSecret) {
    return notFound()
  }

  const output = await db.generatedOutput.findUnique({
    where: { id: outputId },
    include: {
      meetingRequest: {
        include: {
          clientProfile: true,
        },
      },
    },
  })

  if (!output) {
    return notFound()
  }

  const report = JSON.parse(output.contentJson) as MinutesReport
  const meeting = output.meetingRequest

  const allSegments = report.discussionSegments || []
  const firstHalfSegments = allSegments.slice(0, 3)
  const secondHalfSegments = allSegments.slice(3, 6)
  const findings = report.compliance?.findings || []

  const headerLeft = `${meeting.region} · ${meeting.complianceType} · CSE BOARD`
  const headerRight = meeting.title
  const totalPages = 6

  return (
    <div className="bg-slate-50 min-h-screen py-10 print:bg-white print:py-0 text-[var(--doc-ink)]">
      {/* Page 1: Cover Page */}
      <div className="page-break-wrapper">
        <PageChrome pageNumber={1} totalPages={totalPages} headerLeft={headerLeft} headerRight={headerRight}>
          <CoverPage
            meta={report.meta}
            stats={report.stats}
            attendees={report.attendees}
          />
        </PageChrome>
      </div>

      {/* Page 2: Executive Summary & Attendance Register */}
      <div className="page-break-wrapper">
        <PageChrome pageNumber={2} totalPages={totalPages} headerLeft={headerLeft} headerRight={headerRight}>
          <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-150 pb-2 mb-4">
            I. Attendance & Executive Summary
          </h2>
          
          {report.attendees && report.attendees.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attendance Register</p>
              <AttendanceTable attendees={report.attendees} />
            </div>
          )}

          {report.execSummary && report.execSummary.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</p>
              <ExecSummaryCards cards={report.execSummary} />
            </div>
          )}
        </PageChrome>
      </div>

      {/* Page 3: Meeting Discussion (Part 1) */}
      <div className="page-break-wrapper">
        <PageChrome pageNumber={3} totalPages={totalPages} headerLeft={headerLeft} headerRight={headerRight}>
          <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-150 pb-2 mb-4">
            II. Meeting Discussion (1)
          </h2>
          <p className="text-xs text-gray-400 mb-4 font-serif italic">
            Verbatim transcript segments covering agenda initiation and preliminary consultations.
          </p>
          
          <div className="space-y-3">
            {firstHalfSegments.map((seg, idx) => (
              <SpeakerBubble
                key={idx}
                speaker={seg.speaker}
                role={seg.role}
                text={seg.text}
                timestamp={seg.timestamp}
                roleVariant={idx % 2 === 0 ? 'role-a' : 'role-b'}
              />
            ))}
            {firstHalfSegments.length === 0 && (
              <p className="text-gray-400 text-xs italic">No discussion data.</p>
            )}
          </div>
        </PageChrome>
      </div>

      {/* Page 4: Meeting Discussion (Part 2) & Timeline */}
      <div className="page-break-wrapper">
        <PageChrome pageNumber={4} totalPages={totalPages} headerLeft={headerLeft} headerRight={headerRight}>
          <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-150 pb-2 mb-4">
            II. Meeting Discussion (2) & Timeline
          </h2>
          
          {secondHalfSegments.length > 0 && (
            <div className="space-y-3 mb-6">
              {secondHalfSegments.map((seg, idx) => (
                <SpeakerBubble
                  key={idx}
                  speaker={seg.speaker}
                  role={seg.role}
                  text={seg.text}
                  timestamp={seg.timestamp}
                  roleVariant={idx % 2 === 0 ? 'role-b' : 'neutral'}
                />
              ))}
            </div>
          )}

          {report.timeline && report.timeline.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</p>
              <Timeline title="Meeting Progression" entries={report.timeline} />
            </div>
          )}
        </PageChrome>
      </div>

      {/* Page 5: Decisions, Alerts & Votes */}
      <div className="page-break-wrapper">
        <PageChrome pageNumber={5} totalPages={totalPages} headerLeft={headerLeft} headerRight={headerRight}>
          <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-150 pb-2 mb-4">
            III. Decisions & Voting Log
          </h2>

          {report.alerts && report.alerts.length > 0 && (
            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Resolutions</p>
              {report.alerts.map((alert, idx) => (
                <AlertCallout
                  key={idx}
                  type={alert.type}
                  subject={alert.subject}
                  fact={alert.fact}
                  nextStep={alert.nextStep}
                  relatedArticle={alert.relatedArticle}
                />
              ))}
            </div>
          )}

          {report.votes && report.votes.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Voting Register</p>
              {report.votes.map((vote, idx) => (
                <VoteBlock
                  key={idx}
                  question={vote.question}
                  date={vote.voteDate}
                  voters={vote.voters as any}
                  result={vote.result}
                />
              ))}
            </div>
          )}
        </PageChrome>
      </div>

      {/* Page 6: Compliance Audit Results */}
      <div className="page-break-wrapper">
        <PageChrome pageNumber={6} totalPages={totalPages} headerLeft={headerLeft} headerRight={headerRight}>
          <div className="flex justify-between items-center border-b border-gray-150 pb-2 mb-4">
            <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)]">
              IV. Compliance Audit
            </h2>
            {report.compliance?.score !== undefined && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                report.compliance.score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                Score: {report.compliance.score}%
              </span>
            )}
          </div>

          {report.compliance && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-2 font-serif italic">
                Formal regulatory analysis of agenda items and procedures against regional compliance structures.
              </p>

              <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-indigo-950">Risk Exposure Rating</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Assessed regulatory vulnerability levels.</p>
                </div>
                <span className="font-extrabold text-indigo-700 uppercase tracking-wider">
                  {report.compliance.riskExposureLevel} Risk
                </span>
              </div>

              <div className="space-y-2">
                {findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      finding.compliant
                        ? 'bg-emerald-50/20 border-emerald-100'
                        : 'bg-rose-50/20 border-rose-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-gray-600 font-bold">
                          {finding.code}
                        </span>
                        <span className="font-bold text-gray-900">{finding.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{finding.detail}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      finding.compliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {finding.compliant ? '✓ Met' : '✗ Unresolved'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PageChrome>
      </div>
    </div>
  )
}
