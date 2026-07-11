import React from 'react'
import type { ReportMeta } from '@/lib/report-schema'

interface CoverPageProps {
  meta: ReportMeta
  stats: {
    attendees: number
    duration: string
    decisions: number
    actionItems: number
  }
  attendees: { name: string; role: string }[]
}

export const CoverPage: React.FC<CoverPageProps> = ({ meta, stats, attendees }) => {
  return (
    <div className="flex flex-col justify-between h-full min-h-[1000px] bg-white text-[var(--doc-ink)] p-[46px_66px_42px_66px] shadow-[0_0_0_1px_var(--doc-line),0_8px_30px_rgba(16,25,54,0.06)]">
      {/* Header */}
      <div className="flex justify-between text-[11px] tracking-[1.6px] uppercase font-bold text-[var(--doc-muted)] border-b border-[var(--doc-line)] pb-3 mb-6">
        <div>{meta.meetingType} MINUTES &bull; {meta.company}</div>
        <div>{new Date(meta.date).toLocaleDateString('fr-FR')}</div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center my-auto">
        <p className="doc-eyebrow text-[var(--doc-accent)] text-[13px] font-extrabold tracking-[2px] uppercase mb-[22px] flex items-start gap-[10px] flex-wrap leading-[1.4]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
          <span className="text-[var(--doc-accent-gold)] text-[15px] flex-shrink-0">&#9733;</span>
          <span>{meta.complianceType} COMPLIANCE REPORT &bull; OFFICIAL MINUTES</span>
        </p>
        <h1 className="doc-h1 font-serif text-[44px] leading-[1.02] font-extrabold text-[var(--doc-accent)] mb-4 tracking-[-0.01em]">
          {meta.title}
        </h1>
        <p className="doc-subtitle text-[20px] font-bold text-[#6C7898] mt-4 mb-[34px]">
          {meta.company} &bull; {meta.location}
        </p>

        {/* Stats Row — min-width:0 on every cell prevents grid blowout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '1rem',
            marginBottom: '30px',
          }}
        >
          {([
            { label: 'Attendees',    value: stats.attendees },
            { label: 'Duration',     value: stats.duration },
            { label: 'Decisions',    value: stats.decisions },
            { label: 'Action Items', value: stats.actionItems },
          ] as const).map(({ label, value }) => (
            <div
              key={label}
              className="doc-stat-card"
              style={{
                padding: '17px 20px 18px 20px',
                border: '2px solid var(--doc-accent)',
                borderBottomColor: 'var(--doc-accent-gold)',
                borderRadius: '14px',
                minWidth: 0,          /* ← critical: prevents cell from overflowing */
                overflow: 'hidden',
              }}
            >
              <p
                className="doc-stat-label"
                style={{
                  color: 'var(--doc-muted)',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </p>
              <p
                className="doc-stat-value"
                style={{
                  color: 'var(--doc-ink)',
                  fontSize: '17px',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="doc-rule h-[3px] bg-[var(--doc-accent-dark)] mb-[22px] rounded-[2px]" />

        <p className="text-[#485573] text-[18px] leading-[1.55] mb-[30px] max-w-[880px]">
          This document represents the official, compliance-ready meeting minutes of the {meta.complianceType} committee at {meta.company}. 
          It has been automatically transcribed, formatted, and analyzed for legal checklist compliance. 
          Please review the details, key resolutions, and audit summaries inside.
        </p>

        {/* Participants Summary */}
        <h2 className="text-[17px] font-extrabold text-[var(--doc-ink)] tracking-[4px] uppercase mb-[18px] pb-[14px] border-b border-[var(--doc-line)]">
          Key Participants
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {attendees.slice(0, 4).map((person, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[16px] font-extrabold"
                style={{ backgroundColor: idx % 2 === 0 ? 'var(--doc-accent-dark)' : 'var(--doc-accent)' }}
              >
                {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || idx + 1}
              </div>
              <div>
                <p className="text-[14px] leading-[1.45] font-extrabold text-[var(--doc-ink)]">
                  {person.name}
                </p>
                <p className="text-[12px] text-[var(--doc-muted)] font-medium">
                  {person.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[11px] tracking-[1.6px] uppercase font-bold text-[var(--doc-muted)] border-t border-[var(--doc-line)] pt-3 mt-8">
        <div>CONFIDENTIAL &bull; INTERNAL USE ONLY</div>
        <div>{meta.company}</div>
      </div>
    </div>
  )
}
