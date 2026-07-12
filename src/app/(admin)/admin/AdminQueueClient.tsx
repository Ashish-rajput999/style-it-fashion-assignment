'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { KANBAN_COLUMNS } from './queue-constants'

interface MeetingCard {
  id: string
  title: string
  status: string
  tier: string
  region: string
  complianceType: string
  meetingDate: string | null
  createdAt: string
  updatedAt: string
  sourceFileUrl: string | null
  hasTranscript: boolean
  clientName: string
  clientEmail: string
  company: string
  clientProfileId: string
}

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ESSENTIAL: { bg: '#F1F0FF', text: '#5548D9', label: 'Essential' },
  SCOPE: { bg: '#EBF0FF', text: '#2F69FF', label: 'Scope' },
  PREMIUM: { bg: '#FEF7DC', text: '#B98313', label: 'Premium' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function RequestCard({ meeting }: { meeting: MeetingCard }) {
  const tier = TIER_COLORS[meeting.tier] ?? TIER_COLORS.ESSENTIAL
  const col = KANBAN_COLUMNS.find((c) => c.statuses.includes(meeting.status as never))

  return (
    <Link
      href={`/admin/requests/${meeting.id}`}
      className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all group hover:border-indigo-500/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border"
          style={{ background: tier.bg + '20', color: tier.text, borderColor: tier.text + '40' }}
        >
          {tier.label}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: (col?.color ?? '#888') + '20', color: col?.color ?? '#888' }}
        >
          {meeting.status.replace(/_/g, ' ')}
        </span>
      </div>

      <h3 className="font-bold text-sm text-white leading-snug mb-1 group-hover:text-indigo-300 transition-colors line-clamp-2">
        {meeting.title}
      </h3>

      <p className="text-[10px] text-gray-400 mb-3">
        <span
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = `/admin/clients/${meeting.clientProfileId}`
          }}
          className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
        >
          {meeting.company}
        </span>{' '}
        · {meeting.clientEmail}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>{meeting.region} / {meeting.complianceType}</span>
        <span>{formatDate(meeting.updatedAt)}</span>
      </div>

      {meeting.hasTranscript && (
        <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
          <span>✓</span> Transcript ready
        </div>
      )}
    </Link>
  )
}

interface AdminQueueClientProps {
  meetings: MeetingCard[]
}

export function AdminQueueClient({ meetings }: AdminQueueClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterTier, setFilterTier] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (filterStatus !== 'ALL') {
        const col = KANBAN_COLUMNS.find((c) => c.id === filterStatus)
        if (col && !col.statuses.includes(m.status as never)) return false
      }
      if (filterTier !== 'ALL' && m.tier !== filterTier) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !m.title.toLowerCase().includes(q) &&
          !m.company.toLowerCase().includes(q) &&
          !m.clientEmail.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [meetings, filterStatus, filterTier, search])

  // Group filtered meetings by kanban column
  const grouped = KANBAN_COLUMNS.map((col) => ({
    ...col,
    items: filtered.filter((m) => col.statuses.includes(m.status as never)),
  }))

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title, company, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
        />

        <div className="flex gap-1.5">
          {['ALL', ...KANBAN_COLUMNS.map((c) => c.id)].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'All Stages' : KANBAN_COLUMNS.find((c) => c.id === s)?.label ?? s}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 ml-auto">
          {['ALL', 'ESSENTIAL', 'SCOPE', 'PREMIUM'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                filterTier === t
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All Tiers' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {grouped.map((col) => (
          <div key={col.id} className="min-w-[220px]">
            {/* Column header */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-t-xl mb-2"
              style={{ background: col.color + '15', borderBottom: `2px solid ${col.color}40` }}
            >
              <span className="text-base">{col.icon}</span>
              <span className="font-bold text-xs" style={{ color: col.color }}>
                {col.label}
              </span>
              <span
                className="ml-auto text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: col.color + '30', color: col.color }}
              >
                {col.items.length}
              </span>
            </div>

            {/* Column cards */}
            <div className="space-y-2">
              {col.items.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-[10px] font-bold border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center gap-1.5">
                  <span className="text-sm">📥</span>
                  <span>Empty Column</span>
                </div>
              ) : (
                col.items.map((m) => <RequestCard key={m.id} meeting={m} />)
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] max-w-md mx-auto my-12 flex flex-col items-center justify-center p-8">
          <span className="text-3xl mb-4">🔍</span>
          <h4 className="font-extrabold text-sm text-white mb-1">No Matching Requests</h4>
          <p className="text-[11px] text-slate-400 text-center max-w-xs">
            We couldn't find any request profiles matching your search query or chosen compliance filters. Try adjusting your selections.
          </p>
        </div>
      )}
    </div>
  )
}
