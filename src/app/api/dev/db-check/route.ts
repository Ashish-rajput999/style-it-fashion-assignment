import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reset = searchParams.get('reset') === 'true'

    if (reset) {
      // Find all seeded meetings by company name or reference patterns
      await db.meetingRequest.updateMany({
        where: {
          tier: 'PREMIUM',
          status: 'TRANSCRIBED',
        },
        data: {
          status: 'DISPATCHED',
        },
      })
    }

    const meetings = await db.meetingRequest.findMany({
      include: {
        generatedOutputs: true,
        clientProfile: {
          include: {
            user: true,
          },
        },
      },
    })
    return NextResponse.json({
      resetPerformed: reset,
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        tier: m.tier,
        outputs: m.generatedOutputs.map((o) => ({
          id: o.id,
          type: o.type,
          locked: o.locked,
        })),
        client: m.clientProfile?.user?.email,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
