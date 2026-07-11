import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function PreviewPlaceholderPage({ params }: PreviewPageProps) {
  const { id } = await params
  const meeting = await db.meetingRequest.findUnique({
    where: { id },
    include: { previewResult: true },
  })

  if (!meeting) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          📄
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Instant Preview Placeholder</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Successfully generated preview results for meeting: <br />
          <strong className="text-gray-700">{meeting.title}</strong>
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-xs font-mono text-gray-600">
          <div>Status: {meeting.status}</div>
          <div>Region: {meeting.region}</div>
          <div>Compliance: {meeting.complianceType}</div>
          <div>Preview JSON Generated: {meeting.previewResult ? 'Yes' : 'No'}</div>
        </div>
        <div className="flex gap-4">
          <Link
            href="/wizard/region"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-sm font-semibold transition"
          >
            Create Another
          </Link>
          <Link
            href={`/dev/components`}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition"
          >
            View Sandbox
          </Link>
        </div>
      </div>
    </div>
  )
}
