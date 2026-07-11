import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSTTProvider } from '@/lib/providers/stt'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestId } = await req.json()
  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

  const meeting = await db.meetingRequest.findUnique({ where: { id: requestId } })
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  if (!meeting.sourceFileUrl) {
    return NextResponse.json({ error: 'No source file uploaded for this meeting.' }, { status: 400 })
  }

  // Update status to TRANSCRIBING
  await db.meetingRequest.update({
    where: { id: requestId },
    data: { status: 'TRANSCRIBING' },
  })

  // Log action
  await db.auditLog.create({
    data: {
      meetingRequestId: requestId,
      actorId: session.user.id,
      action: 'TRANSCRIPTION_TRIGGERED',
    },
  })

  try {
    const stt = getSTTProvider()
    const result = await stt.transcribe(meeting.sourceFileUrl)
    const segments = result.segments

    // Save rawJson — never touch editedJson here
    const existing = await db.transcript.findUnique({ where: { meetingRequestId: requestId } })
    if (existing) {
      await db.transcript.update({
        where: { meetingRequestId: requestId },
        data: { rawJson: JSON.stringify(segments) },
      })
    } else {
      await db.transcript.create({
        data: {
          meetingRequestId: requestId,
          rawJson: JSON.stringify(segments),
        },
      })
    }

    // Update status to TRANSCRIBED
    await db.meetingRequest.update({
      where: { id: requestId },
      data: { status: 'TRANSCRIBED' },
    })

    await db.auditLog.create({
      data: {
        meetingRequestId: requestId,
        actorId: session.user.id,
        action: 'TRANSCRIPTION_COMPLETED',
        metadata: JSON.stringify({ segmentCount: segments.length }),
      },
    })

    return NextResponse.json({ segments })
  } catch (err: any) {
    // Revert status on failure
    await db.meetingRequest.update({
      where: { id: requestId },
      data: { status: 'ADMIN_INTAKE' },
    })
    return NextResponse.json({ error: err.message || 'Transcription failed' }, { status: 500 })
  }
}
