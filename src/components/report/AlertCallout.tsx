import React from 'react'

interface AlertCalloutProps {
  type: 'decision' | 'unresolved' | 'tension' | 'projection'
  subject: string
  fact: string
  nextStep?: string
  implication?: string
  responsibleEntity?: string
  relatedArticle?: string
}

export const AlertCallout: React.FC<AlertCalloutProps> = ({
  type,
  subject,
  fact,
  nextStep,
  implication,
  responsibleEntity,
  relatedArticle
}) => {
  let bg = 'bg-[#F2FBF7]'
  let border = 'border-l-4 border-l-[var(--ok)]'
  let labelColor = 'text-[var(--ok)]'
  let label = 'Decision'

  if (type === 'unresolved') {
    bg = 'bg-[#FFF8E8]'
    border = 'border-l-4 border-l-[var(--warn)]'
    labelColor = 'text-[var(--warn)]'
    label = 'Unresolved / Suspended'
  } else if (type === 'tension') {
    bg = 'bg-[#FFF4F2]'
    border = 'border-l-4 border-l-[var(--danger)]'
    labelColor = 'text-[var(--danger)]'
    label = 'Tension / Blockage'
  } else if (type === 'projection') {
    bg = 'bg-[#F7F4FF]'
    border = 'border-l-4 border-l-[var(--info)]'
    labelColor = 'text-[var(--info)]'
    label = 'Projection / Deadline'
  }

  return (
    <div className={`p-[20px_24px] rounded-[12px] mb-[18px] text-left shadow-sm ${bg} ${border}`}>
      <div className="flex justify-between items-baseline mb-[9px]">
        <p className={`text-[12px] font-extrabold tracking-[1.8px] uppercase m-0 ${labelColor}`}>
          Alert &mdash; {label}
        </p>
        {relatedArticle && (
          <span className="text-[11px] font-bold text-[var(--doc-muted)] font-mono">{relatedArticle}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[var(--doc-ink-soft)] text-[14px] leading-[1.6] m-0">
          <strong className="text-[var(--doc-ink)] font-bold">Subject:</strong> {subject}
        </p>
        <p className="text-[var(--doc-ink-soft)] text-[14px] leading-[1.6] m-0">
          <strong className="text-[var(--doc-ink)] font-bold">Fact:</strong> {fact}
        </p>
        {implication && (
          <p className="text-[var(--doc-ink-soft)] text-[14px] leading-[1.6] m-0">
            <strong className="text-[var(--doc-ink)] font-bold">Implication:</strong> {implication}
          </p>
        )}
        {nextStep && (
          <p className="text-[var(--doc-ink-soft)] text-[14px] leading-[1.6] m-0">
            <strong className="text-[var(--doc-ink)] font-bold">Next Step:</strong> {nextStep}
          </p>
        )}
        {responsibleEntity && (
          <p className="text-[var(--doc-ink-soft)] text-[14px] leading-[1.6] m-0">
            <strong className="text-[var(--doc-ink)] font-bold">Responsible Entity:</strong> {responsibleEntity}
          </p>
        )}
      </div>
    </div>
  )
}
