import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { outputId, action } = await req.json() as {
    outputId: string
    action: 'lock' | 'unlock'
  }

  if (!outputId || !action) {
    return NextResponse.json({ error: 'outputId and action required' }, { status: 400 })
  }

  const output = await db.generatedOutput.findUnique({ where: { id: outputId } })
  if (!output) return NextResponse.json({ error: 'Output not found' }, { status: 404 })

  if (action === 'lock') {
    if (output.locked) {
      return NextResponse.json({ error: 'Already locked' }, { status: 409 })
    }
    await db.generatedOutput.update({
      where: { id: outputId },
      data: { locked: true, lockedAt: new Date() },
    })
    await db.auditLog.create({
      data: {
        meetingRequestId: output.meetingRequestId,
        actorId: session.user.id,
        action: 'OUTPUT_LOCKED',
        metadata: JSON.stringify({ outputId, lockedBy: session.user.name }),
      },
    })
    return NextResponse.json({ ok: true, locked: true })
  }

  if (action === 'unlock') {
    await db.generatedOutput.update({
      where: { id: outputId },
      data: { locked: false, lockedAt: null },
    })
    await db.auditLog.create({
      data: {
        meetingRequestId: output.meetingRequestId,
        actorId: session.user.id,
        action: 'OUTPUT_UNLOCKED',
        metadata: JSON.stringify({ outputId }),
      },
    })
    return NextResponse.json({ ok: true, locked: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
