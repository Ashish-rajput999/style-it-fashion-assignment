import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
