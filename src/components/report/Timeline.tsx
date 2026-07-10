import React from 'react'

interface TimelineEntry {
  date: string
  description: string
}

interface TimelineProps {
  title: string
  entries: TimelineEntry[]
}

export const Timeline: React.FC<TimelineProps> = ({ title, entries }) => {
  return (
    <div className="p-[20px_24px] bg-[var(--doc-bg-tint)] border-l-4 border-[var(--doc-accent)] rounded-[12px] mb-[18px] text-left">
      <p className="text-[var(--doc-accent)] text-[12px] font-extrabold tracking-[1.8px] uppercase mb-[14px] m-0">
        Timeline &mdash; {title}
      </p>
      <table className="w-full border-collapse">
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx}>
              <td className="w-[34px] align-top pb-[13px]">
                <div className="w-[12px] h-[12px] rounded-full bg-[var(--doc-accent)] mt-[7px]" />
              </td>
              <td className="pb-[13px] text-[var(--doc-ink-soft)] text-[14px] leading-[1.6] align-top">
                <span className="font-bold text-[var(--doc-ink)]">{entry.date}</span> &mdash; {entry.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export default Timeline
