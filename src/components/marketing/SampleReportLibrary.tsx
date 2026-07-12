'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookViewer } from '@/components/ebook/BookViewer'
import { CoverPage } from '@/components/report/CoverPage'
import { AttendanceTable } from '@/components/report/AttendanceTable'
import { ExecSummaryCards } from '@/components/report/ExecSummaryCards'
import { SpeakerBubble } from '@/components/report/SpeakerBubble'
import { AlertCallout } from '@/components/report/AlertCallout'
import { Timeline } from '@/components/report/Timeline'
import { VoteBlock } from '@/components/report/VoteBlock'
import type { MinutesReport } from '@/lib/report-schema'

interface SampleReportData {
  id: string
  title: string
  meetingDate: string
  region: string
  complianceType: string
  meetingType: string | null
  status: string
  tier: string
  contentJson: string
}

interface SampleReportLibraryProps {
  reports: SampleReportData[]
}

const TIER_META: Record<string, { bg: string; text: string; border: string; desc: string; icon: string }> = {
  ESSENTIAL: {
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-700',
    border: 'border-indigo-100',
    desc: 'Chronological summary, basic keyword compliance audits, and simple diarization logs.',
    icon: '⭐',
  },
  SCOPE: {
    bg: 'bg-blue-50/50',
    text: 'text-blue-700',
    border: 'border-blue-100',
    desc: 'Agenda-based format, full regulatory checklist audit, and automated vote outcome tabulation.',
    icon: '💎',
  },
  PREMIUM: {
    bg: 'bg-amber-50/50',
    text: 'text-amber-700',
    border: 'border-amber-100',
    desc: 'Formal legal layout with letterhead, clause-by-clause compliance warnings, and audit certificate trails.',
    icon: '👑',
  },
}

export function SampleReportLibrary({ reports }: SampleReportLibraryProps) {
  const [activeReport, setActiveReport] = useState<SampleReportData | null>(null)
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

  // Prevent scroll when modal is open
  useEffect(() => {
    if (activeReport) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [activeReport])

  const parsedReport = activeReport ? (JSON.parse(activeReport.contentJson) as MinutesReport) : null
  const allSegments = parsedReport?.discussionSegments || []
  const firstHalfSegments = allSegments.slice(0, 3)
  const secondHalfSegments = allSegments.slice(3, 6)
  const findings = parsedReport?.compliance?.findings || []

  return (
    <div className="w-full">
      {/* Grid of sample cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reports.map((report) => {
          const meta = TIER_META[report.tier] || TIER_META.ESSENTIAL
          const parsed = JSON.parse(report.contentJson) as MinutesReport
          const stats = parsed.stats || { attendees: 0, duration: '—', decisions: 0 }
          
          return (
            <motion.div
              key={report.id}
              className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-200 transition-all group"
              whileHover={{ y: -4 }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border} flex items-center gap-1`}>
                    <span>{meta.icon}</span> {report.tier}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 font-mono">
                    {report.region} · {report.complianceType}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-950 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {report.title}
                </h3>
                <p className="text-xs text-gray-500 mb-6 line-clamp-3">
                  {meta.desc}
                </p>
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100 text-center mb-6">
                  <div>
                    <span className="block text-xs font-black text-gray-900">{stats.attendees}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Attendees</span>
                  </div>
                  <div className="border-x border-gray-200">
                    <span className="block text-xs font-black text-gray-900">{stats.duration}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Duration</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-gray-900">{stats.decisions}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Decisions</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveReport(report)}
                className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0F1226] text-white hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                Open Sample Report →
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Modal overlay containing the BookViewer */}
      <AnimatePresence>
        {activeReport && parsedReport && (
          <motion.div
            className="fixed inset-0 z-[1000] bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-50 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            >
              {/* Modal Top Bar */}
              <div className="bg-[#0F1226] text-white py-4 px-6 md:px-8 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-400/20 text-amber-300 rounded-lg flex items-center justify-center text-xs font-bold">
                    {TIER_META[activeReport.tier]?.icon || '📄'}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm leading-none line-clamp-1">{activeReport.title}</h2>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {activeReport.tier} Sample Report · {activeReport.region} · {activeReport.complianceType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-brand transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    📥 Download PDF
                  </button>
                  <button
                    onClick={() => setActiveReport(null)}
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center font-bold text-white transition-all text-sm cursor-pointer"
                    aria-label="Close template preview"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Book content wrapper */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-slate-50">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-150 overflow-hidden">
                  <BookViewer
                    watermarkText="SAMPLE REPORT"
                    bindingLabel="SAMPLE REPORT — DEMO ONLY"
                  >
                    {/* Page 1: Cover Page */}
                    <div className="flex flex-col h-full overflow-auto text-[var(--doc-ink)]">
                      <CoverPage
                        meta={parsedReport.meta}
                        stats={parsedReport.stats}
                        attendees={parsedReport.attendees}
                      />
                    </div>

                    {/* Page 2: Executive Summary & Attendance Register */}
                    <div className="flex flex-col h-full overflow-auto text-gray-900">
                      <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-150 pb-2 mb-4">
                        I. Attendance & Executive Summary
                      </h2>
                      
                      {parsedReport.attendees && parsedReport.attendees.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attendance Register</p>
                          <AttendanceTable attendees={parsedReport.attendees} />
                        </div>
                      )}

                      {parsedReport.execSummary && parsedReport.execSummary.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</p>
                          <ExecSummaryCards cards={parsedReport.execSummary} />
                        </div>
                      )}
                    </div>

                    {/* Page 3: Meeting Discussion (Part 1) */}
                    <div className="flex flex-col h-full overflow-auto text-gray-900">
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
                      </div>
                    </div>

                    {/* Page 4: Meeting Discussion (Part 2) & Timeline */}
                    <div className="flex flex-col h-full overflow-auto text-gray-900">
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

                      {parsedReport.timeline && parsedReport.timeline.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</p>
                          <Timeline title="Meeting Progression" entries={parsedReport.timeline} />
                        </div>
                      )}
                    </div>

                    {/* Page 5: Decisions, Alerts & Votes */}
                    <div className="flex flex-col h-full overflow-auto text-gray-900">
                      <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-150 pb-2 mb-4">
                        III. Decisions & Voting Log
                      </h2>

                      {parsedReport.alerts && parsedReport.alerts.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Resolutions</p>
                          {parsedReport.alerts.map((alert, idx) => (
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

                      {parsedReport.votes && parsedReport.votes.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Voting Register</p>
                          {parsedReport.votes.map((vote, idx) => (
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
                    <div className="flex flex-col h-full overflow-auto text-gray-900">
                      <div className="flex justify-between items-center border-b border-gray-150 pb-2 mb-4">
                        <h2 className="text-lg font-serif font-extrabold text-[var(--doc-accent)]">
                          IV. Compliance Audit
                        </h2>
                        {parsedReport.compliance?.score !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            parsedReport.compliance.score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            Score: {parsedReport.compliance.score}%
                          </span>
                        )}
                      </div>

                      {parsedReport.compliance && (
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
                              {parsedReport.compliance.riskExposureLevel} Risk
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#0F1226] border border-gray-800 text-white px-5 py-3 rounded-xl shadow-xl z-[9999] animate-bounce text-xs font-semibold flex items-center gap-2">
          <span>ℹ️</span> {toastMessage}
        </div>
      )}
    </div>
  )
}
