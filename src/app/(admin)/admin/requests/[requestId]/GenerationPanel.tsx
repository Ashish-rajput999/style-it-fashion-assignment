'use client'

import React, { useState, useCallback } from 'react'
import { getTierOutputs } from '@/lib/tiers'
import type { OutputType, Tier } from '@/lib/tiers'
import { ReportAnalyzer } from '@/components/admin/ReportAnalyzer'
import { DocumentEditor } from '@/components/admin/DocumentEditor'

const OUTPUT_META: Record<OutputType, { label: string; icon: string; desc: string }> = {
  SPEAKER_ANALYSIS: {
    label: 'Speaker Analysis',
    icon: '🎤',
    desc: 'Participation breakdown, turn counts, topic allocation per speaker.',
  },
  REPORT_ANALYZER: {
    label: 'Report Analyzer',
    icon: '📊',
    desc: 'Compliance score, risk findings table, interactive dashboard.',
  },
  NUMERICAL_DATA: {
    label: 'Numerical Data',
    icon: '📈',
    desc: 'Key figures, chart data, and metric extraction from transcript.',
  },
  MINUTES_REPORT: {
    label: 'Minutes Report',
    icon: '📝',
    desc: 'Full formal meeting minutes document — opens in Document Editor.',
  },
  PPT_EXPORT: {
    label: 'PPT Export',
    icon: '📑',
    desc: 'Presentation-ready slide data (Premium only).',
  },
}

interface GeneratedOutputData {
  id: string
  type: string
  contentJson: string
  locked: boolean
  createdAt: string
}

interface GenerationPanelProps {
  requestId: string
  tier: string
  hasTranscript: boolean
  existingOutputs: GeneratedOutputData[]
}

export function GenerationPanel({
  requestId,
  tier,
  hasTranscript,
  existingOutputs: initialOutputs,
}: GenerationPanelProps) {
  const [outputs, setOutputs] = useState<GeneratedOutputData[]>(initialOutputs)
  const [selected, setSelected] = useState<Set<OutputType>>(new Set())
  const [generating, setGenerating] = useState<Set<OutputType>>(new Set())
  const [errors, setErrors] = useState<Record<OutputType, string>>({} as any)
  const [viewingOutput, setViewingOutput] = useState<GeneratedOutputData | null>(null)

  const availableOutputs = getTierOutputs(tier as Tier)

  const toggleSelected = (ot: OutputType) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(ot)) next.delete(ot)
      else next.add(ot)
      return next
    })
  }

  const generateSelected = useCallback(async () => {
    if (selected.size === 0 || !hasTranscript) return

    // Generate each selected output type sequentially
    for (const ot of Array.from(selected)) {
      setGenerating(prev => new Set([...prev, ot]))
      setErrors(prev => { const n = { ...prev }; delete n[ot as OutputType]; return n })

      try {
        const res = await fetch('/api/admin/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, outputType: ot }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Generation failed')

        const newOutput: GeneratedOutputData = {
          id: data.outputId,
          type: ot,
          contentJson: data.contentJson,
          locked: false,
          createdAt: new Date().toISOString(),
        }

        setOutputs(prev => {
          const filtered = prev.filter(o => o.type !== ot)
          return [...filtered, newOutput]
        })
      } catch (err: any) {
        setErrors(prev => ({ ...prev, [ot]: err.message }))
      } finally {
        setGenerating(prev => {
          const n = new Set(prev)
          n.delete(ot)
          return n
        })
      }
    }

    setSelected(new Set())
  }, [selected, requestId, hasTranscript])

  const viewOutput = (output: GeneratedOutputData) => {
    setViewingOutput(output)
  }

  const handleLockChange = (outputId: string, locked: boolean) => {
    setOutputs(prev => prev.map(o => o.id === outputId ? { ...o, locked } : o))
    if (viewingOutput?.id === outputId) {
      setViewingOutput(prev => prev ? { ...prev, locked } : null)
    }
  }

  // ── Viewer mode ────────────────────────────────────────────────────────────
  if (viewingOutput) {
    const parsed = (() => {
      try { return JSON.parse(viewingOutput.contentJson) } catch { return null }
    })()

    return (
      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewingOutput(null)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold transition-all text-white"
          >
            ←
          </button>
          <div>
            <h3 className="text-sm font-bold text-white">
              {OUTPUT_META[viewingOutput.type as OutputType]?.icon}{' '}
              {OUTPUT_META[viewingOutput.type as OutputType]?.label}
            </h3>
            {viewingOutput.locked && (
              <span className="text-[9px] font-bold text-amber-400">🔒 Locked</span>
            )}
          </div>
        </div>

        {/* Report Analyzer */}
        {viewingOutput.type === 'REPORT_ANALYZER' && parsed && (
          <div className="flex-1 overflow-auto">
            <ReportAnalyzer data={parsed} />
          </div>
        )}

        {/* Document Editor for MINUTES_REPORT */}
        {viewingOutput.type === 'MINUTES_REPORT' && (
          <div className="flex-1 overflow-hidden">
            <DocumentEditor
              outputId={viewingOutput.id}
              initialContent={typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}
              isLocked={viewingOutput.locked}
              onLockChange={(locked) => handleLockChange(viewingOutput.id, locked)}
            />
          </div>
        )}

        {/* Speaker Analysis / Numerical data — formatted JSON view */}
        {['SPEAKER_ANALYSIS', 'NUMERICAL_DATA', 'PPT_EXPORT'].includes(viewingOutput.type) && (
          <div className="flex-1 overflow-auto bg-white rounded-2xl border border-gray-200 p-6">
            <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed overflow-auto">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  // ── Panel mode ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Generate Outputs</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Tier: <span className="font-bold text-indigo-400">{tier}</span> ·{' '}
            {availableOutputs.length} output types available
          </p>
        </div>

        {!hasTranscript && (
          <div className="px-3 py-2 bg-amber-500/15 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-medium">
            ⚠ Run transcription first
          </div>
        )}
      </div>

      {/* Output type checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableOutputs.map((ot) => {
          const meta = OUTPUT_META[ot]
          const isGenerating = generating.has(ot)
          const existingOutput = outputs.find(o => o.type === ot)
          const hasError = !!errors[ot]
          const isSelected = selected.has(ot)

          return (
            <div
              key={ot}
              className={`relative border rounded-xl p-4 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : hasError
                  ? 'border-red-500/40 bg-red-500/5'
                  : existingOutput
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!hasTranscript || isGenerating}
                  onChange={() => toggleSelected(ot)}
                  className="mt-0.5 accent-indigo-500 w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span>{meta.icon}</span>
                    <span className="text-xs font-bold text-white">{meta.label}</span>
                    {existingOutput?.locked && (
                      <span className="text-[9px] text-amber-400">🔒</span>
                    )}
                    {existingOutput && !existingOutput.locked && (
                      <span className="text-[9px] text-emerald-400 font-bold">✓ Generated</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">{meta.desc}</p>

                  {hasError && (
                    <p className="text-[9px] text-red-400 font-medium mt-1">✗ {errors[ot]}</p>
                  )}
                </div>
              </label>

              {/* Loading overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white text-xs font-bold">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </div>
                </div>
              )}

              {/* View button for existing output */}
              {existingOutput && !isGenerating && (
                <button
                  onClick={() => viewOutput(existingOutput)}
                  className="mt-2 w-full text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 py-1.5 bg-indigo-500/10 rounded-lg transition border border-indigo-500/20 hover:bg-indigo-500/20"
                >
                  {ot === 'REPORT_ANALYZER' ? '📊 View Dashboard' :
                   ot === 'MINUTES_REPORT' ? '📝 Open Editor' : '👁 View Output'} →
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={generateSelected}
          disabled={selected.size === 0 || !hasTranscript || generating.size > 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selected.size === 0 || !hasTranscript || generating.size > 0
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
          }`}
        >
          {generating.size > 0 ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              Generating {generating.size} output(s)…
            </>
          ) : (
            <>⚡ Generate {selected.size > 0 ? `${selected.size} ` : ''}Selected</>
          )}
        </button>

        {selected.size === 0 && hasTranscript && (
          <p className="text-[10px] text-gray-500">
            Select at least one output type above
          </p>
        )}
      </div>
    </div>
  )
}
