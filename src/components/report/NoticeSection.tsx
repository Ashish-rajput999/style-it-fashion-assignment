import React from 'react'

interface NoticeSectionProps {
  title?: string
  paragraphs?: string[]
}

export const NoticeSection: React.FC<NoticeSectionProps> = ({ 
  title = 'Notice / Scope Statement',
  paragraphs = [
    'Use this page for any framing text your report needs — a legal notice, methodology note, disclaimer, or scope statement. Keep it short: two or three plain paragraphs.',
    'This compliance report compiles transcript audit markers and formal resolutions to check alignment with regulatory standards (e.g. French Labor Code for CSE committees). It serves as an internal record and does not substitute for direct legal council.',
    'Under Article L.2315-34 of the French Labor Code, the minutes must be prepared and communicated within regulatory deadlines. Access to this document is protected under corporate governance bylaws.'
  ]
}) => {
  return (
    <div className="mb-6">
      {paragraphs.map((p, idx) => (
        <p key={idx} className="mb-4 text-[var(--doc-ink-soft)] text-[15px] leading-[1.68]">
          {p}
        </p>
      ))}
    </div>
  )
}
