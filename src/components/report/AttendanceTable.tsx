import React from 'react'
import type { Attendee } from '@/lib/report-schema'

interface AttendanceTableProps {
  attendees: Attendee[]
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ attendees }) => {
  return (
    <div className="mb-6">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[var(--doc-accent-dark)] text-white text-[11px] font-extrabold tracking-[1px] uppercase">
            <th className="p-[11px_12px] rounded-tl-[8px]">Name</th>
            <th className="p-[11px_12px]">Role / Function</th>
            <th className="p-[11px_12px] text-center">Arrival</th>
            <th className="p-[11px_12px] text-center">Departure</th>
            <th className="p-[11px_12px] text-center rounded-tr-[8px]">Status</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee, idx) => (
            <tr key={idx} className="border-b border-[var(--doc-line-soft)] hover:bg-[#fafbff] transition-colors">
              <td className="p-[11px_12px] font-semibold text-[var(--doc-ink)]">{attendee.name}</td>
              <td className="p-[11px_12px] text-[var(--doc-ink-soft)]">{attendee.role}</td>
              <td className="p-[11px_12px] text-center text-[var(--doc-ink-soft)]">{attendee.arrival || '--:--'}</td>
              <td className="p-[11px_12px] text-center text-[var(--doc-ink-soft)]">{attendee.departure || '--:--'}</td>
              <td className="p-[11px_12px] text-center">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold tracking-[0.5px] uppercase ${
                  attendee.status === 'Present' 
                    ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                    : attendee.status === 'Excused'
                    ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                    : 'bg-[var(--danger-soft)] text-[var(--danger)]'
                }`}>
                  {attendee.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
