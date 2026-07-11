import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ReportBook } from './ReportBook'
import type { MinutesReport } from '@/lib/report-schema'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params

  const meeting = await db.meetingRequest.findUnique({
    where: { id },
    include: {
      generatedOutputs: { where: { type: 'MINUTES_REPORT' }, take: 1 },
    },
  })

  if (!meeting) notFound()

  // Parse dispatched MINUTES_REPORT
  let report: MinutesReport | null = null
  if (meeting.generatedOutputs[0]?.contentJson) {
    try {
      report = JSON.parse(meeting.generatedOutputs[0].contentJson) as MinutesReport
    } catch (err) {
      console.error('Error parsing minutes report JSON:', err)
    }
  }

  // If report isn't generated or ready yet, show processing state
  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-150 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-pulse">
            ⏳
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Report In Progress</h2>
          <p className="text-gray-500 text-xs mb-6">
            The administrator team is still working on building and verifying compliance for <span className="font-semibold text-gray-800">"{meeting.title}"</span>. 
            The official minutes will appear here once dispatched.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-brand transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ReportBook
      meeting={{
        id: meeting.id,
        title: meeting.title,
        meetingDate: meeting.meetingDate,
        region: meeting.region,
        complianceType: meeting.complianceType,
        meetingType: meeting.meetingType,
        status: meeting.status,
        tier: meeting.tier,
      }}
      report={report}
    />
  )
}
