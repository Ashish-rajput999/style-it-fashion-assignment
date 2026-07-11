'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  {
    id: 'upload',
    icon: '☁️',
    label: 'Uploading',
    desc: 'Securing your file and preparing for transcription…',
    color: '#6D5DF6',
  },
  {
    id: 'transcribe',
    icon: '🎙️',
    label: 'Transcribing',
    desc: 'AI is analyzing the audio with speaker diarization…',
    color: '#2F69FF',
  },
  {
    id: 'analyze',
    icon: '🛡️',
    label: 'Analyzing',
    desc: 'Running compliance audit against the French Labor Code…',
    color: '#198C61',
  },
  {
    id: 'build',
    icon: '📄',
    label: 'Building Preview',
    desc: 'Generating your structured meeting minutes report…',
    color: '#F6BF2F',
  },
]

export default function ProcessingPage() {
  const router = useRouter()
  const params = useSearchParams()
  const draftId = params.get('draftId') ?? ''

  const [currentStage, setCurrentStage] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!draftId) return

    // Advance stages with timed intervals for UX
    let stageIndex = 0
    const intervals: NodeJS.Timeout[] = []

    const advanceStage = () => {
      if (stageIndex < STAGES.length - 1) {
        stageIndex++
        setCurrentStage(stageIndex)
      }
    }

    // Stage 0→1 after 1.5s
    intervals.push(setTimeout(() => advanceStage(), 1500))
    // Stage 1→2 after 4s
    intervals.push(setTimeout(() => advanceStage(), 4000))
    // Stage 2→3 after 6.5s
    intervals.push(setTimeout(() => advanceStage(), 6500))

    // Kick off actual processing call at the same time
    const runProcessing = async () => {
      try {
        const res = await fetch('/api/wizard/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Processing failed.')
      } catch (err: any) {
        setError(err.message)
      }
    }
    runProcessing()

    // Complete after 9s, then redirect to the live book preview page
    const doneTimer = setTimeout(() => {
      setDone(true)
      setTimeout(() => {
        router.push(`/wizard/preview?draftId=${draftId}`)
      }, 1200)
    }, 9000)

    return () => {
      intervals.forEach(clearTimeout)
      clearTimeout(doneTimer)
    }
  }, [draftId, router])

  if (!draftId) {
    return (
      <div className="wizard-error-state">
        <p>No wizard session found. <a href="/wizard/region" className="auth-link">Start over →</a></p>
      </div>
    )
  }

  const stage = STAGES[currentStage]

  return (
    <div className="processing-shell">
      <div className="processing-card">
        {/* Header */}
        <div className="processing-header">
          <div className="processing-logo-mark">M</div>
          <h2 className="processing-title">
            {done ? 'Report Ready!' : 'Building Your Report…'}
          </h2>
          <p className="processing-sub">
            {done
              ? 'Your compliance-ready meeting minutes are ready to review.'
              : 'Please wait while we analyse your recording and build the report.'}
          </p>
        </div>

        {/* Stage track */}
        <div className="processing-stages">
          {STAGES.map((s, idx) => {
            const isActive = idx === currentStage
            const isComplete = idx < currentStage || done
            return (
              <motion.div
                key={s.id}
                className={[
                  'processing-stage',
                  isActive ? 'processing-stage--active' : '',
                  isComplete ? 'processing-stage--complete' : '',
                ].join(' ')}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
              >
                <div
                  className="processing-stage-icon-wrap"
                  style={{ borderColor: isActive || isComplete ? s.color : undefined }}
                >
                  <AnimatePresence mode="wait">
                    {isComplete ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="processing-stage-icon"
                        style={{ color: s.color }}
                      >
                        ✓
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: isActive ? [1, 1.08, 1] : 1 }}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 1.4 }}
                        className="processing-stage-icon"
                        style={{ color: isActive ? s.color : '#9AA8C2' }}
                      >
                        {s.icon}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="processing-stage-body">
                  <p className={`processing-stage-label ${isActive || isComplete ? 'processing-stage-label--active' : ''}`}>
                    {s.label}
                  </p>
                  <AnimatePresence>
                    {isActive && !done && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="processing-stage-desc"
                      >
                        {s.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="processing-progress-track">
          <motion.div
            className="processing-progress-fill"
            initial={{ width: '0%' }}
            animate={{ width: done ? '100%' : `${(currentStage / (STAGES.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </div>

        {/* Done call-to-action */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="processing-done"
            >
              <div className="processing-done-icon">🎉</div>
              <p className="processing-done-text">Redirecting you to your instant preview…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="auth-error" style={{ marginTop: 24 }} role="alert">
            <span className="auth-error-icon">⚠</span>
            {error} — your report may still have been generated.
          </div>
        )}
      </div>
    </div>
  )
}
