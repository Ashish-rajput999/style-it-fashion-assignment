'use client'

import React, { useState, useCallback, useRef } from 'react'

export interface Segment {
  speaker: string
  start: number
  end: number
  text: string
}

interface TranscriptEditorProps {
  requestId: string
  initialSegments: Segment[] | null
  hasSourceFile: boolean
  hasSavedEdits: boolean
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Distinct speaker colors (up to 6 different speakers)
const SPEAKER_COLORS = [
  { bg: '#EBF0FF', text: '#2F69FF', border: '#C4D0FF' },
  { bg: '#F1EEFF', text: '#7A5AF8', border: '#D8D0FF' },
  { bg: '#E8F7F1', text: '#198C61', border: '#B5E2D0' },
  { bg: '#FEF8E8', text: '#B98313', border: '#F5DFA0' },
  { bg: '#FEF0F0', text: '#D94B4B', border: '#F5C0C0' },
  { bg: '#F0F9FF', text: '#0369A1', border: '#BAE0FD' },
]

function getSpeakerColor(speaker: string, speakerIndex: Map<string, number>) {
  if (!speakerIndex.has(speaker)) {
    speakerIndex.set(speaker, speakerIndex.size % SPEAKER_COLORS.length)
  }
  return SPEAKER_COLORS[speakerIndex.get(speaker)!]
}

interface SegmentRowProps {
  seg: Segment
  index: number
  speakerIndex: Map<string, number>
  allSpeakers: string[]
  onChange: (index: number, updated: Segment) => void
}

function SegmentRow({ seg, index, speakerIndex, allSpeakers, onChange }: SegmentRowProps) {
  const [editingSpeaker, setEditingSpeaker] = useState(false)
  const [editingText, setEditingText] = useState(false)
  const [speakerDraft, setSpeakerDraft] = useState(seg.speaker)
  const [textDraft, setTextDraft] = useState(seg.text)
  const speakerInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const color = getSpeakerColor(seg.speaker, speakerIndex)

  const commitSpeaker = () => {
    setEditingSpeaker(false)
    if (speakerDraft.trim() !== seg.speaker) {
      onChange(index, { ...seg, speaker: speakerDraft.trim() || seg.speaker })
    }
  }

  const commitText = () => {
    setEditingText(false)
    if (textDraft !== seg.text) {
      onChange(index, { ...seg, text: textDraft })
    }
  }

  const startEditSpeaker = () => {
    setSpeakerDraft(seg.speaker)
    setEditingSpeaker(true)
    setTimeout(() => speakerInputRef.current?.select(), 30)
  }

  const startEditText = () => {
    setTextDraft(seg.text)
    setEditingText(true)
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }, 30)
  }

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0 group items-start">
      {/* Time */}
      <div className="text-[10px] font-mono text-gray-400 w-14 shrink-0 pt-1 text-right">
        {formatTime(seg.start)}
      </div>

      {/* Speaker badge — click to edit */}
      <div className="w-36 shrink-0">
        {editingSpeaker ? (
          <div className="relative">
            <input
              ref={speakerInputRef}
              value={speakerDraft}
              onChange={(e) => setSpeakerDraft(e.target.value)}
              onBlur={commitSpeaker}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitSpeaker()
                if (e.key === 'Escape') { setSpeakerDraft(seg.speaker); setEditingSpeaker(false) }
              }}
              className="w-full border-2 border-indigo-400 rounded-lg px-2 py-1 text-xs font-bold bg-indigo-50 text-indigo-900 focus:outline-none"
              list={`speakers-${index}`}
            />
            <datalist id={`speakers-${index}`}>
              {allSpeakers.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
        ) : (
          <button
            onClick={startEditSpeaker}
            title="Click to rename speaker"
            className="w-full text-left px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all hover:scale-105 hover:shadow-sm"
            style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
          >
            {seg.speaker}
            <span className="ml-1 opacity-40 text-[9px] font-normal">✎</span>
          </button>
        )}
      </div>

      {/* Transcript text — click to edit */}
      <div className="flex-1">
        {editingText ? (
          <textarea
            ref={textareaRef}
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setTextDraft(seg.text); setEditingText(false) }
            }}
            rows={3}
            className="w-full border-2 border-indigo-400 rounded-lg px-3 py-2 text-sm text-gray-900 bg-indigo-50 focus:outline-none resize-none"
          />
        ) : (
          <p
            onClick={startEditText}
            title="Click to edit transcript text"
            className="text-sm text-gray-800 leading-relaxed cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-indigo-50 hover:text-indigo-900 transition-all"
          >
            {seg.text}
            <span className="ml-1.5 opacity-0 group-hover:opacity-40 text-[9px] text-gray-400 font-normal transition-opacity">
              click to edit
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export function TranscriptEditor({
  requestId,
  initialSegments,
  hasSourceFile,
  hasSavedEdits,
}: TranscriptEditorProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments ?? [])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Memoised speaker colour map (reset when segments change shape)
  const speakerIndex = useRef(new Map<string, number>())
  const allSpeakers = [...new Set(segments.map((s) => s.speaker))]

  const runTranscription = useCallback(async () => {
    setIsTranscribing(true)
    setTranscribeError(null)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/admin/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transcription failed')
      speakerIndex.current = new Map()
      setSegments(data.segments)
      setIsDirty(false)
      setSaveStatus('idle')
    } catch (err: any) {
      setTranscribeError(err.message)
    } finally {
      setIsTranscribing(false)
    }
  }, [requestId])

  const updateSegment = useCallback((index: number, updated: Segment) => {
    setSegments((prev) => {
      const next = [...prev]
      next[index] = updated
      return next
    })
    setIsDirty(true)
    setSaveStatus('idle')
  }, [])

  const saveEdits = useCallback(async () => {
    if (!isDirty) return
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/admin/transcript/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, segments }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Save failed')
      }
      setSaveStatus('saved')
      setIsDirty(false)
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [requestId, segments, isDirty])

  const hasSegments = segments.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={runTranscription}
          disabled={isTranscribing || !hasSourceFile}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            isTranscribing
              ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
              : !hasSourceFile
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isTranscribing ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              Transcribing…
            </>
          ) : (
            <>🎙️ Run Transcription</>
          )}
        </button>

        {!hasSourceFile && (
          <span className="text-xs text-amber-600 font-medium">
            ⚠ No source file — upload one first
          </span>
        )}

        {hasSegments && (
          <>
            <button
              onClick={saveEdits}
              disabled={isSaving || !isDirty}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                isSaving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : !isDirty
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                  Saving…
                </>
              ) : (
                <>💾 Save Edits</>
              )}
            </button>

            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                ✓ Edits saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600 font-bold">✗ Save failed — try again</span>
            )}
            {isDirty && saveStatus === 'idle' && (
              <span className="text-xs text-amber-600 font-medium">• Unsaved changes</span>
            )}
          </>
        )}

        {hasSavedEdits && !isDirty && saveStatus === 'idle' && hasSegments && (
          <span className="text-xs text-indigo-500 font-medium ml-auto">
            Showing edited version · Raw preserved
          </span>
        )}
      </div>

      {/* Error */}
      {transcribeError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          ✗ {transcribeError}
        </div>
      )}

      {/* Empty state — no segments yet */}
      {!hasSegments && !isTranscribing && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-3">🎙️</div>
          <h3 className="font-bold text-gray-700 mb-1">No Transcript Yet</h3>
          <p className="text-gray-500 text-xs max-w-xs">
            Click <strong>Run Transcription</strong> to process the source audio and generate an editable transcript.
          </p>
        </div>
      )}

      {/* Segment list */}
      {hasSegments && (
        <div className="flex-1 overflow-auto border border-gray-200 rounded-2xl bg-white">
          {/* Speaker legend */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50 rounded-t-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 self-center">Speakers:</span>
            {allSpeakers.map((sp) => {
              const c = getSpeakerColor(sp, speakerIndex.current)
              return (
                <span
                  key={sp}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{ background: c.bg, color: c.text, borderColor: c.border }}
                >
                  {sp}
                </span>
              )
            })}
            <span className="ml-auto text-[10px] text-gray-400">{segments.length} segments</span>
          </div>

          {/* Segments */}
          <div className="px-4 divide-y divide-gray-50">
            {segments.map((seg, i) => (
              <SegmentRow
                key={i}
                seg={seg}
                index={i}
                speakerIndex={speakerIndex.current}
                allSpeakers={allSpeakers}
                onChange={updateSegment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
