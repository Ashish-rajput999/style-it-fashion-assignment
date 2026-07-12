'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DispatchButtonProps {
  requestId: string
  status: string
  isDispatchable: boolean
  disabledReason?: string
}

export function DispatchButton({
  requestId,
  status,
  isDispatchable,
  disabledReason,
}: DispatchButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDispatch = async () => {
    if (!isDispatchable) return
    const ok = window.confirm(
      'Are you sure you want to dispatch this report to the client? This will finalize the status to DELIVERED and grant report access to the client portal.'
    )
    if (!ok) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/output/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Dispatch failed')
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'DISPATCHED') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs">
        <span>✓</span> Dispatched to Client
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-[10px] text-red-400 font-semibold max-w-xs truncate">
          ⚠ {error}
        </span>
      )}
      <button
        onClick={handleDispatch}
        disabled={loading || !isDispatchable}
        title={!isDispatchable ? disabledReason : 'Deliver final report to client'}
        className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
          loading
            ? 'bg-gray-150 text-gray-400 cursor-not-allowed'
            : !isDispatchable
            ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed hover:bg-white/5'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:scale-[1.02]'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
            Dispatching…
          </span>
        ) : (
          '🚀 Dispatch to Client'
        )}
      </button>
    </div>
  )
}
