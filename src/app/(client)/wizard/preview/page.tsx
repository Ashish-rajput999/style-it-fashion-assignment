import React from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookViewer } from '@/components/ebook/BookViewer'
import { SpeakerBubble } from '@/components/report/SpeakerBubble'
import { AlertCallout } from '@/components/report/AlertCallout'
import { DataTable } from '@/components/report/DataTable'

import { PreviewChart } from '@/components/charts/PreviewChart'

interface PreviewPageProps {
  searchParams: Promise<{ draftId?: string }>
}

export default async function WizardPreviewPage({ searchParams }: PreviewPageProps) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const { draftId } = await searchParams
  if (!draftId) {
    redirect('/wizard/region')
  }

  const meeting = await db.meetingRequest.findUnique({
    where: { id: draftId },
    include: {
      previewResult: true
    }
  })

  if (!meeting || !meeting.previewResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <p className="text-xl font-bold text-gray-700 mb-4">No preview result available yet.</p>
        <Link href="/wizard/region" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Return to Start
        </Link>
      </div>
    )
  }

  // Parse stored JSONs
  let speakerData: any = {}
  let chartData: any = {}
  let complianceData: any = {}

  try {
    speakerData = JSON.parse(meeting.previewResult.speakerAnalysisJson || '{}')
    chartData = JSON.parse(meeting.previewResult.chartDataJson || '{}')
    complianceData = JSON.parse(meeting.previewResult.complianceJson || '{}')
  } catch (err) {
    console.error('Error parsing preview JSON data:', err)
  }

  // Formatting for Recharts
  const chartDataPoints = chartData.participationData || []

  // Formatting compliance checklist findings
  const findings = complianceData.findings || []
  const tableRows = findings.map((f: any) => [
    f.code || 'N/A',
    f.label || 'N/A',
    f.compliant ? (
      <span key="s" className="inline-flex items-center gap-1 text-green-700 font-bold text-xs">✓ Compliant</span>
    ) : (
      <span key="s" className="inline-flex items-center gap-1 text-red-700 font-bold text-xs">✗ Non-compliant</span>
    ),
  ])

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      {/* Top Banner indicating preview status */}
      <div className="max-w-5xl mx-auto mb-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-amber-800 font-bold text-lg">Instant Live Preview</h3>
            <p className="text-amber-700 text-sm">This is a restricted draft preview of your compliance minutes report.</p>
          </div>
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
            PREVIEW ONLY
          </span>
        </div>
      </div>

      {/* Book Container wrapper */}
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-10">
        <BookViewer>
          {/* Page 1: Speaker Analysis */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-100 pb-3 mb-4">
              I. Speaker Participation
            </h2>
            <p className="text-xs text-gray-400 mb-4 font-serif italic">
              Word counts and participation share extracted from audio transcript.
            </p>
            <div className="flex-1 space-y-3 overflow-auto">
              {(speakerData.speakers || []).slice(0, 4).map((speaker: any, idx: number) => {
                // Use real derived role from mock LLM to colour-code
                const lower = (speaker.name || '').toLowerCase()
                const variant =
                  lower.includes('président') || lower.includes('directeur')
                    ? 'neutral'
                    : lower.includes('élu') || lower.includes('cgt') || lower.includes('syndical') || lower.includes('représentant')
                    ? 'role-a'
                    : 'role-b'
                return (
                  <SpeakerBubble
                    key={idx}
                    speaker={speaker.name}
                    role={speaker.role}
                    text={
                      speaker.sampleText
                        ? `"${speaker.sampleText.slice(0, 100)}…" — ${speaker.wordCount} words (${speaker.participationPct}% of meeting)`
                        : `${speaker.wordCount || 0} words spoken (${speaker.participationPct || 0}% participation)`
                    }
                    roleVariant={variant}
                  />
                )
              })}
              {!speakerData.speakers?.length && (
                <p className="text-gray-400 text-sm italic">No speaker data available.</p>
              )}
            </div>
          </div>

          {/* Page 2: Numerical/Chart Data */}
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-serif font-extrabold text-[var(--doc-accent)] border-b border-gray-100 pb-3 mb-6">
              II. Word Count Metrics
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-serif italic">
              Visual share of spoken dialogue mapped by total words per participant.
            </p>
            <div className="flex-1 w-full min-h-[300px]">
              {chartDataPoints.length > 0 ? (
                <PreviewChart data={chartDataPoints} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No chart data available
                </div>
              )}
            </div>
          </div>

          {/* Page 3: Compliance Safety-Check */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-xl font-serif font-extrabold text-[var(--doc-accent)]">
                III. Compliance Audit
              </h2>
              {complianceData.score !== undefined && (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  complianceData.score >= 80 ? 'bg-green-100 text-green-700'
                  : complianceData.score >= 50 ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  Score: {complianceData.score}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3 font-serif italic">
              CSE checklist against French Labor Code requirements.
            </p>
            <div className="flex-1 overflow-auto space-y-2">
              {/* Show non-compliant alerts first */}
              {findings.filter((f: any) => !f.compliant).slice(0, 2).map((finding: any, idx: number) => (
                <AlertCallout
                  key={idx}
                  type="tension"
                  subject={finding.label}
                  fact={finding.detail}
                  relatedArticle={finding.code}
                />
              ))}
              {/* Full findings table */}
              <DataTable
                headers={['Code', 'Requirement', 'Status']}
                rows={tableRows}
                widths={['20%', '45%', '35%']}
              />
              {!findings.length && (
                <p className="text-gray-400 text-sm italic">No compliance data available.</p>
              )}
            </div>
          </div>
        </BookViewer>
      </div>

      {/* CTA panel leading towards quotation form */}
      <div className="max-w-md mx-auto text-center bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-indigo-950 font-extrabold text-lg mb-2">Unlock Full Compliance Package</h3>
        <p className="text-indigo-800 text-sm mb-4">
          Order a certified formal legal layout document, complete with digital sign-offs and an official audit certificate.
        </p>
        <Link 
          href={`/wizard/quote?draftId=${draftId}`} 
          className="inline-block w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition"
        >
          Request Quote & Distribution →
        </Link>
      </div>
    </div>
  )
}
