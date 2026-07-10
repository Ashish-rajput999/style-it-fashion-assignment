import React from 'react'
import type { ReportMeta } from '@/lib/report-schema'

interface DocDetailsTableProps {
  meta: ReportMeta
}

export const DocDetailsTable: React.FC<DocDetailsTableProps> = ({ meta }) => {
  const details = [
    { label: 'Report Label', value: `${meta.complianceType} Official Minutes` },
    { label: 'Title', value: meta.title },
    { label: 'Date', value: new Date(meta.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'Type', value: meta.meetingType },
    { label: 'Location', value: meta.location || 'N/A' },
    { label: 'Prepared By', value: meta.preparedBy || 'MeetingMind AI' },
    { label: 'Reference ID', value: meta.reference },
  ]

  return (
    <div className="mb-6">
      <table className="w-full border-collapse text-[14px]">
        <tbody>
          {details.map((detail, idx) => (
            <tr key={idx}>
              <td className="w-[34%] p-[13px_16px] text-[var(--doc-muted)] text-[11px] font-extrabold tracking-[1.5px] uppercase bg-[var(--doc-bg-tint)] align-top">
                {detail.label}
              </td>
              <td className="p-[13px_16px] text-[var(--doc-ink)] bg-white border-b border-[var(--doc-line-soft)] align-top font-medium leading-[1.55]">
                {detail.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
