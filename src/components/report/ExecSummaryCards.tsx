import React from 'react'
import type { ExecSummaryCard } from '@/lib/report-schema'

interface ExecSummaryCardsProps {
  cards: ExecSummaryCard[]
}

export const ExecSummaryCards: React.FC<ExecSummaryCardsProps> = ({ cards }) => {
  return (
    <div className="flex flex-col gap-[18px] mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="p-[20px_24px] bg-[var(--doc-bg-tint)] border-l-4 border-[var(--doc-accent)] rounded-[12px]">
          <p className="text-[var(--doc-accent)] text-[12px] font-extrabold tracking-[1.8px] uppercase mb-[9px]">
            {card.label}
          </p>
          <p className="text-[var(--doc-ink)] text-[15px] leading-[1.7] m-0">
            {card.text}
          </p>
        </div>
      ))}
    </div>
  )
}
