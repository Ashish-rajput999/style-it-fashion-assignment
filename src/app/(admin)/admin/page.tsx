import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AdminQueueClient } from './AdminQueueClient'
import { KANBAN_COLUMNS } from './queue-constants'

export default async function AdminQueuePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const meetings = await db.meetingRequest.findMany({
    include: {
      clientProfile: {
        include: { user: true },
      },
      transcript: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Pass serialisable data to the client component
  const serialised = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    tier: m.tier,
    region: m.region,
    complianceType: m.complianceType,
    meetingDate: m.meetingDate?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    sourceFileUrl: m.sourceFileUrl ?? null,
    hasTranscript: !!m.transcript,
    clientName: m.clientProfile.user.name,
    clientEmail: m.clientProfile.user.email,
    company: m.clientProfile.companyName,
  }))

  return (
    <div className="min-h-screen bg-[#0F1226] text-white flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="border-b border-white/10 px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-extrabold text-sm shadow">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight leading-none">MeetingMind</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Admin Console</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-400">
          <Link href="/admin" className="text-white">Queue</Link>
          <span className="opacity-40 cursor-not-allowed">Clients</span>
          <span className="opacity-40 cursor-not-allowed">Prompts</span>
        </nav>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400 hidden sm:block">{session.user.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 px-3 rounded-lg transition-all">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Queue Body */}
      <main className="flex-1 px-6 md:px-10 py-8 overflow-hidden">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">Request Queue</h2>
            <p className="text-gray-400 text-xs mt-1">
              {meetings.length} total requests across all clients · Sorted by last update
            </p>
          </div>
          {/* Summary pills */}
          <div className="flex flex-wrap gap-2">
            {KANBAN_COLUMNS.map((col) => {
              const count = meetings.filter((m) => col.statuses.includes(m.status as never)).length
              return (
                <div key={col.id} className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                  <span>{col.icon}</span>
                  <span className="text-gray-300">{col.label}</span>
                  <span className="text-white">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Client-side interactive kanban with filters */}
        <AdminQueueClient meetings={serialised} />
      </main>
    </div>
  )
}
