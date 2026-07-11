import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { clientProfile: true },
    })
    if (!user?.clientProfile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const region = formData.get('region') as string || 'FR'
    const complianceType = formData.get('complianceType') as string || 'CSE'
    const language = formData.get('language') as string || 'fr'

    const draft = await db.meetingRequest.create({
      data: {
        clientProfileId: user.clientProfile.id,
        title: 'Untitled Meeting',
        meetingDate: new Date(),
        region,
        complianceType,
        language,
        tier: 'ESSENTIAL',
        status: 'DRAFT',
      },
    })

    const res = NextResponse.json({ draftId: draft.id }, { status: 201 })
    res.cookies.set('wizardDraftId', draft.id, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    })
    return res
  } catch (err) {
    console.error('[WIZARD DRAFT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
