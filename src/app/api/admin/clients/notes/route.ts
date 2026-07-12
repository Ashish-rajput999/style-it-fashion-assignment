import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, notesFromAdmin } = await req.json() as {
    clientId: string
    notesFromAdmin: string
  }

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  await db.clientProfile.update({
    where: { id: clientId },
    data: { notesFromAdmin },
  })

  return NextResponse.json({ success: true })
}
