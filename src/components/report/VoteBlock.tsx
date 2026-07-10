import React from 'react'

interface VoterResult {
  name: string
  group: string
  vote: 'Favorable' | 'Unfavorable' | 'Abstention'
}

interface VoteBlockProps {
  question: string
  date: string
  voters: VoterResult[]
  result: string
}

export const VoteBlock: React.FC<VoteBlockProps> = ({
  question,
  date,
  voters,
  result
}) => {
  // Count votes
  const favorableCount = voters.filter(v => v.vote === 'Favorable').length
  const unfavorableCount = voters.filter(v => v.vote === 'Unfavorable').length
  const abstentionCount = voters.filter(v => v.vote === 'Abstention').length

  return (
    <div className="flex flex-col gap-4 mb-6 text-left">
      {/* Question */}
      <div className="p-[18px_22px] bg-[var(--doc-bg-tint)] border border-[#DCE5F2] border-l-4 border-l-[var(--info)] rounded-[12px]">
        <p className="text-[var(--info)] text-[14px] font-extrabold leading-[1.45] m-0">
          Vote &mdash; {question}
        </p>
      </div>

      {/* Vote Date */}
      <div className="p-[20px_24px] bg-[var(--doc-bg-tint)] border-l-4 border-l-[var(--ok)] rounded-[12px]">
        <p className="text-[var(--ok)] text-[12px] font-extrabold tracking-[1.8px] uppercase mb-[9px] m-0">
          Vote Date
        </p>
        <p className="text-[var(--doc-ink)] text-[15px] leading-[1.7] m-0">
          {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Voters Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--doc-accent-dark)] text-white text-[11px] font-extrabold tracking-[1px] uppercase">
            <th className="p-[11px_12px] rounded-tl-[8px]">Voter</th>
            <th className="p-[11px_12px]">Group</th>
            <th className="p-[11px_12px] text-right rounded-tr-[8px]">Vote</th>
          </tr>
        </thead>
        <tbody>
          {voters.map((voter, idx) => (
            <tr key={idx} className="border-b border-[var(--doc-line-soft)] hover:bg-[#fafbff] transition-colors">
              <td className="p-[11px_12px] text-[var(--doc-ink-soft)] font-medium">{voter.name}</td>
              <td className="p-[11px_12px] text-[var(--doc-muted)] font-mono text-xs">{voter.group}</td>
              <td className="p-[11px_12px] text-right">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  voter.vote === 'Favorable'
                    ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                    : voter.vote === 'Unfavorable'
                    ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                    : 'bg-[var(--warn-soft)] text-[var(--warn)]'
                }`}>
                  {voter.vote}
                </span>
              </td>
            </tr>
          ))}
          {/* Summary Row */}
          <tr className="bg-[var(--doc-bg-tint)] font-bold text-[12px] text-[var(--doc-ink)]">
            <td className="p-[11px_12px] rounded-bl-[8px]" colSpan={2}>
              Summary
            </td>
            <td className="p-[11px_12px] text-right rounded-br-[8px]">
              Favorable: {favorableCount} &bull; Unfavorable: {unfavorableCount} &bull; Abstention: {abstentionCount}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Outcome Result */}
      <div className="p-[20px_24px] bg-[var(--doc-bg-tint)] border-l-4 border-l-[var(--ok)] rounded-[12px]">
        <p className="text-[var(--ok)] text-[12px] font-extrabold tracking-[1.8px] uppercase mb-[9px] m-0">
          Result
        </p>
        <p className="text-[var(--doc-ink)] text-[15px] leading-[1.7] m-0">
          {result}
        </p>
      </div>
    </div>
  )
}
