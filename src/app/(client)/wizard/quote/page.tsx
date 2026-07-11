import React from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { QuoteForm } from './QuoteForm'
import type { Tier } from '@/lib/tiers'

interface QuotePageProps {
  searchParams: Promise<{ draftId?: string }>
}

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const { draftId } = await searchParams
  if (!draftId) redirect('/wizard/region')

  const meeting = await db.meetingRequest.findUnique({
    where: { id: draftId },
  })

  if (!meeting) redirect('/wizard/region')

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <QuoteForm
        draftId={draftId}
        initialTier={(meeting.tier as Tier) || 'ESSENTIAL'}
        meetingTitle={meeting.title}
      />
    </div>
  )
}
