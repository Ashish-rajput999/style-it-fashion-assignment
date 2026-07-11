import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { outputId, contentJson } = await req.json() as {
    outputId: string
    contentJson: string
  }

  if (!outputId || !contentJson) {
    return NextResponse.json({ error: 'outputId and contentJson required' }, { status: 400 })
  }

  const output = await db.generatedOutput.findUnique({ where: { id: outputId } })
  if (!output) return NextResponse.json({ error: 'Output not found' }, { status: 404 })

  if (output.locked) {
    return NextResponse.json({ error: 'This output is locked and cannot be edited.' }, { status: 409 })
  }

  await db.generatedOutput.update({
    where: { id: outputId },
    data: { contentJson },
  })

  return NextResponse.json({ ok: true })
}
