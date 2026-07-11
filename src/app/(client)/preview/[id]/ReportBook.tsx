'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookViewer } from '@/components/ebook/BookViewer'
import { CoverPage } from '@/components/report/CoverPage'
import { AttendanceTable } from '@/components/report/AttendanceTable'
import { ExecSummaryCards } from '@/components/report/ExecSummaryCards'
import { SpeakerBubble } from '@/components/report/SpeakerBubble'
import { AlertCallout } from '@/components/report/AlertCallout'
import { Timeline } from '@/components/report/Timeline'
import { VoteBlock } from '@/components/report/VoteBlock'
import type { MinutesReport } from '@/lib/report-schema'

interface ReportBookProps {
  meeting: {
    id: string
    title: string
    meetingDate: Date | null
    region: string
    complianceType: string
    meetingType: string | null
    status: string
    tier: string
  }
  report: MinutesReport
}

export function ReportBook({ meeting, report }: ReportBookProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleDownloadPDF = () => {
    setToastMessage('Export coming in a later phase (Phase 12 PDF Export)')
  }

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Split discussion segments for presentation
  const allSegments = report.discussionSegments || []
  const firstHalfSegments = allSegments.slice(0, 3)
  const secondHalfSegments = allSegments.slice(3, 6)

  // Map compliance findings for the table
  const findings = report.compliance?.findings || []
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky top bar */}
      <div className="bg-[#0F1226] text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center font-bold text-white transition-all text-xs">
            ←
          </Link>
          <div>
            <h1 className="font-extrabold text-sm leading-none line-clamp-1">{meeting.title}</h1>
            <p className="text-[9px] text-gray-400 font-semibold mt-1 uppercase tracking-widest">
              {meeting.region} · {meeting.complianceType} · Final Report
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-brand transition-all flex items-center gap-1.5"
          >
            📥 Download PDF
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto py-10 px-4 md:px-8">
        
        {/* Immersive Book Shell */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <BookViewer>
            {/* Page 1: Cover Page */}
            <div className="flex flex-col h-full overflow-auto">
              <CoverPage
                meta={report.meta}
                stats={report.stats}
                attendees={report.attendees}
              />
            </div>

            {/* Page 2: Executive Summary & Attendance Register */}
            <div className="flex flex-col h-full overflow-auto">
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
            </div>

            {/* Page 3: Meeting Discussion (Part 1) */}
            <div className="flex flex-col h-full overflow-auto">
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
            </div>

            {/* Page 4: Meeting Discussion (Part 2) & Timeline */}
            <div className="flex flex-col h-full overflow-auto">
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
            </div>

            {/* Page 5: Decisions, Alerts & Votes */}
            <div className="flex flex-col h-full overflow-auto">
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
            </div>

            {/* Page 6: Compliance Audit Results */}
            <div className="flex flex-col h-full overflow-auto">
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
            </div>
          </BookViewer>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#0F1226] border border-gray-800 text-white px-5 py-3 rounded-xl shadow-xl z-[999] animate-bounce text-xs font-semibold flex items-center gap-2">
          <span>ℹ️</span> {toastMessage}
        </div>
      )}
    </div>
  )
}
