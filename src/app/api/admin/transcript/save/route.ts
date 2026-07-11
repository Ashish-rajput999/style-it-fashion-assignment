import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export interface TranscriptSegment {
  speaker: string
  start: number
  end: number
  text: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestId, segments } = await req.json() as {
    requestId: string
    segments: TranscriptSegment[]
  }

  if (!requestId || !segments) {
    return NextResponse.json({ error: 'requestId and segments required' }, { status: 400 })
  }

  const existing = await db.transcript.findUnique({ where: { meetingRequestId: requestId } })
  if (!existing) {
    return NextResponse.json({ error: 'Transcript not found. Run transcription first.' }, { status: 404 })
  }

  // Save to editedJson — rawJson stays untouched as audit trail
  await db.transcript.update({
    where: { meetingRequestId: requestId },
    data: { editedJson: JSON.stringify(segments) },
  })

  await db.auditLog.create({
    data: {
      meetingRequestId: requestId,
      actorId: session.user.id,
      action: 'TRANSCRIPT_EDITED',
      metadata: JSON.stringify({ segmentCount: segments.length }),
    },
  })

  return NextResponse.json({ ok: true })
}
