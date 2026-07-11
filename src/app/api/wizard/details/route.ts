import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const draftId = formData.get('draftId') as string
    const title = formData.get('title') as string
    const location = formData.get('location') as string
    const meetingType = formData.get('meetingType') as string
    const meetingDate = formData.get('meetingDate') as string

    if (!draftId || !title || !location || !meetingDate) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    await db.meetingRequest.update({
      where: { id: draftId },
      data: {
        title,
        location,
        meetingType,
        meetingDate: new Date(meetingDate),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WIZARD DETAILS]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
