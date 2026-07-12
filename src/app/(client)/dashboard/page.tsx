import React from 'react'
import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Status translation mapping
const STATUS_MAP: Record<string, { label: string; colorClass: string; desc: string }> = {
  DRAFT: {
    label: 'Draft',
    colorClass: 'bg-gray-100 text-gray-700 border-gray-200',
    desc: 'Details not fully submitted yet.',
  },
  PREVIEWED: {
    label: 'Preview Ready',
    colorClass: 'bg-violet-50 text-violet-700 border-violet-150',
    desc: 'Instant draft preview is ready to review.',
  },
  QUOTED: {
    label: 'Quotation Submitted',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-150',
    desc: 'Waiting for administration team approval.',
  },
  ADMIN_INTAKE: {
    label: 'Under Review',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-150',
    desc: 'Admin team is reviewing the files.',
  },
  TRANSCRIBING: {
    label: 'Transcribing',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-150',
    desc: 'Converting recording audio to text.',
  },
  TRANSCRIBED: {
    label: 'Processing',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-150',
    desc: 'Analyzing transcript content.',
  },
  GENERATING: {
    label: 'Generating Report',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-150',
    desc: 'Building final legal layout.',
  },
  IN_EDITING: {
    label: 'Editing in Progress',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-150',
    desc: 'Admin reviewer is polishing the draft.',
  },
  LOCKED: {
    label: 'Final Review',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-150',
    desc: 'Document locked for quality assurance check.',
  },
  DISPATCHED: {
    label: 'Delivered',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-150',
    desc: 'Official minutes ready. Signature trail active.',
  },
}

// Utility helper to map tier codes to user-friendly colors
function getTierStyle(tier: string) {
  switch (tier) {
    case 'PREMIUM':
      return { label: 'Premium', class: 'bg-amber-500/10 text-amber-700 border-amber-200' }
    case 'SCOPE':
      return { label: 'Scope', class: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' }
    default:
      return { label: 'Essential', class: 'bg-slate-500/10 text-slate-700 border-slate-200' }
  }
}

export default async function ClientDashboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { clientProfile: true },
  })
  if (!user) redirect('/login')

  let profile = user.clientProfile
  if (!profile) {
    profile = await db.clientProfile.create({
      data: {
        userId: user.id,
        companyName: user.name ?? 'My Company',
        region: 'FR',
        complianceType: 'CSE',
      },
    })
  }

  const meetings = await db.meetingRequest.findMany({
    where: { clientProfileId: profile.id },
    include: {
      previewResult: true,
      generatedOutputs: { where: { type: 'MINUTES_REPORT' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate top-row dashboard stats
  const totalCount = meetings.length
  const activeCount = meetings.filter((m: any) => m.status !== 'DISPATCHED' && m.status !== 'DRAFT').length
  const deliveredCount = meetings.filter((m: any) => m.status === 'DISPATCHED').length

  // Calculate overall compliance average from dispatched reports
  let totalScore = 0
  let scoreCount = 0
  meetings.forEach((m: any) => {
    if (m.status === 'DISPATCHED' && m.generatedOutputs[0]?.contentJson) {
      try {
        const report = JSON.parse(m.generatedOutputs[0].contentJson)
        if (report?.compliance?.score !== undefined) {
          totalScore += report.compliance.score
          scoreCount++
        }
      } catch {}
    } else if (m.previewResult?.complianceJson) {
      try {
        const preview = JSON.parse(m.previewResult.complianceJson)
        if (preview?.score !== undefined) {
          totalScore += preview.score
          scoreCount++
        }
      } catch {}
    }
  })
  const complianceAvg = scoreCount > 0 ? Math.round(totalScore / scoreCount) : null

  // Group meetings into categories
  const activeMeetings = meetings.filter((m: any) => m.status !== 'DISPATCHED')
  const deliveredMeetings = meetings.filter((m: any) => m.status === 'DISPATCHED')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Premium Top Navigation Header */}
      <header className="bg-[#0F1226] text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-brand">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none">MeetingMind</h1>
            <p className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-widest">Client Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-bold text-xs leading-none text-white">{user.name}</span>
            <span className="text-[10px] text-gray-400 font-medium mt-1">{profile.companyName}</span>
          </div>

          <div className="flex gap-3">
            <Link
              href="/wizard/region"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-brand transition-all flex items-center gap-1.5"
            >
              <span className="text-sm">+</span> New Report
            </Link>
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }} className="m-0">
              <button
                type="submit"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold text-xs py-2 px-4 rounded-xl transition-all"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
        
        {/* Welcome banner */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Welcome back, {user.name?.split(' ')[0]}</h2>
          <p className="text-gray-500 text-xs mt-1">Here is a snapshot of your organizational compliance meeting reports.</p>
        </div>

        {/* Top Analytics Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-extrabold text-indigo-950 mt-2">{totalCount}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Operations</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-2">{activeCount}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivered Reports</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">{deliveredCount}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Compliance</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-2">
              {complianceAvg !== null ? `${complianceAvg}%` : 'N/A'}
            </p>
          </div>
        </div>

        {totalCount === 0 ? (
          /* Premium Empty State Workspace */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-xl mx-auto shadow-sm my-10">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              🎙️
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Reports Created Yet</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto mb-6">
              Create your first compliance minutes report by uploading raw meeting audio, video, or files. Our AI process checks CSE standards automatically.
            </p>
            <Link
              href="/wizard/region"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-brand transition-all"
            >
              + Launch Creation Wizard
            </Link>
          </div>
        ) : (
          /* Normal Listings */
          <div className="space-y-10">
            {/* Active & In Progress Meetings */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Active & In-Progress Requests</h3>
              {activeMeetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeMeetings.map((meeting: any) => {
                    const statusConfig = STATUS_MAP[meeting.status] || {
                      label: meeting.status,
                      colorClass: 'bg-gray-100 text-gray-700 border-gray-200',
                      desc: 'Processing request.',
                    }
                    const tierConfig = getTierStyle(meeting.tier)

                    return (
                      <div
                        key={meeting.id}
                        className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${tierConfig.class}`}>
                              {tierConfig.label}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${statusConfig.colorClass}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-gray-900 leading-snug mb-1 line-clamp-1">
                            {meeting.title}
                          </h4>
                          
                          <p className="text-[10px] text-gray-400 font-medium mb-3">
                            Created: {new Date(meeting.createdAt).toLocaleDateString('fr-FR')}
                          </p>

                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                            {statusConfig.desc}
                          </p>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex gap-2">
                          {meeting.status === 'DRAFT' ? (
                            <Link
                              href={`/wizard/details?draftId=${meeting.id}`}
                              className="w-full text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[10px] rounded-lg transition"
                            >
                              Resume Draft
                            </Link>
                          ) : meeting.status === 'QUOTED' ? (
                            <Link
                              href={`/wizard/quote?draftId=${meeting.id}`}
                              className="w-full text-center py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition"
                            >
                              Review Proposal
                            </Link>
                          ) : meeting.status === 'PREVIEWED' ? (
                            <Link
                              href={`/wizard/preview?draftId=${meeting.id}`}
                              className="w-full text-center py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition"
                            >
                              View Live Preview
                            </Link>
                          ) : (
                            /* Operational state in-progress */
                            <button
                              disabled
                              className="w-full py-2 px-3 bg-gray-100 text-gray-400 font-bold text-[10px] rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              Awaiting Operation Delivery
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500 text-xs shadow-sm">
                  💡 No active or in-progress requests at the moment. Use the wizard above to start a new compliance minutes report!
                </div>
              )}
            </div>

            {/* Delivered Reports */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Delivered Reports</h3>
              {deliveredMeetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deliveredMeetings.map((meeting: any) => {
                    const tierConfig = getTierStyle(meeting.tier)
                    return (
                      <div
                        key={meeting.id}
                        className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${tierConfig.class}`}>
                              {tierConfig.label}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded border bg-emerald-50 text-emerald-700 border-emerald-150">
                              Delivered
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-gray-900 leading-snug mb-1 line-clamp-1">
                            {meeting.title}
                          </h4>
                          
                          <p className="text-[10px] text-gray-400 font-medium mb-3">
                            Date: {new Date(meeting.meetingDate || meeting.createdAt).toLocaleDateString('fr-FR')}
                          </p>

                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                            Official works council CSE meeting minutes. Formally compliant layout signed off.
                          </p>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex gap-2">
                          <Link
                            href={`/preview/${meeting.id}`}
                            className="w-full text-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition"
                          >
                            Open Report Viewer
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-xs shadow-sm">
                  📚 No compliance reports have been delivered yet. Once admin verification and dispatch are complete, they will appear here.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
