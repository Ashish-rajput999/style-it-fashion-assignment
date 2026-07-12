import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestId } = await req.json() as { requestId: string }

  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 })
  }

  const meeting = await db.meetingRequest.findUnique({
    where: { id: requestId },
    include: { generatedOutputs: true },
  })

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 })
  }

  // Find the MINUTES_REPORT output
  const reportOutput = meeting.generatedOutputs.find((o) => o.type === 'MINUTES_REPORT')
  if (!reportOutput) {
    return NextResponse.json({
      error: 'Cannot dispatch. Minutes Report output has not been generated yet.',
    }, { status: 400 })
  }

  if (!reportOutput.locked) {
    return NextResponse.json({
      error: 'Cannot dispatch. Minutes Report must be locked first to freeze its content.',
    }, { status: 400 })
  }

  const now = new Date()

  // Transaction to update request, outputs, and create log
  await db.$transaction([
    db.meetingRequest.update({
      where: { id: requestId },
      data: { status: 'DISPATCHED' },
    }),
    db.generatedOutput.updateMany({
      where: { meetingRequestId: requestId },
      data: { dispatchedAt: now },
    }),
    db.auditLog.create({
      data: {
        meetingRequestId: requestId,
        actorId: session.user.id,
        action: 'REQUEST_DISPATCHED',
        metadata: JSON.stringify({ dispatchedAt: now }),
      },
    }),
  ])

  return NextResponse.json({ success: true, dispatchedAt: now })
}
