import React from 'react'

interface SpeakerBubbleProps {
  speaker: string
  role: string
  text: string
  timestamp?: string
  roleVariant?: 'neutral' | 'role-a' | 'role-b'
}

export const SpeakerBubble: React.FC<SpeakerBubbleProps> = ({
  speaker,
  role,
  text,
  timestamp,
  roleVariant
}) => {
  // Derive role variant if not explicitly supplied
  const variant = roleVariant || (
    speaker.toLowerCase().includes('président') || speaker.toLowerCase().includes('directeur')
      ? 'role-neutral'
      : speaker.toLowerCase().includes('élu') || speaker.toLowerCase().includes('représentant')
      ? 'role-a'
      : 'role-b'
  )

  const initials = speaker
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Coloring schemes based on derived variant
  let badgeBg = 'bg-[var(--doc-accent-dark)]'
  let borderLeft = 'border-l-[var(--doc-accent-dark)]'
  let nameColor = 'text-[var(--doc-accent-dark)]'

  if (variant === 'role-a') {
    badgeBg = 'bg-[var(--doc-accent)]'
    borderLeft = 'border-l-[var(--doc-accent)]'
    nameColor = 'text-[var(--doc-accent)]'
  } else if (variant === 'role-b') {
    badgeBg = 'bg-[var(--ok)]'
    borderLeft = 'border-l-[var(--ok)]'
    nameColor = 'text-[var(--ok)]'
  }

  return (
    <div className="flex gap-4 mb-3 text-left">
      <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[12px] font-extrabold flex-shrink-0 mt-1 shadow-sm ${badgeBg}`}>
        {initials || 'M'}
      </div>
      <div className={`flex-1 p-[16px_20px] bg-white border border-[#DCE5F2] border-l-4 rounded-[10px] shadow-sm ${borderLeft}`}>
        <div className="flex justify-between items-baseline mb-[7px]">
          <p className={`text-[12px] font-extrabold tracking-[1.2px] uppercase ${nameColor}`}>
            {speaker} {role ? `(${role})` : ''}
          </p>
          {timestamp && (
            <span className="text-[11px] text-[var(--doc-muted)] font-mono">{timestamp}</span>
          )}
        </div>
          <p className="text-[var(--doc-ink-soft)] text-[14px] leading-[1.65] m-0">
            {text}
          </p>
      </div>
    </div>
  )
}
