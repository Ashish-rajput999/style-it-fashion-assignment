import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSTTProvider } from '@/lib/providers/stt'
import { getLLMProvider } from '@/lib/providers/llm'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await req.json()
    if (!draftId) return NextResponse.json({ error: 'Missing draftId.' }, { status: 400 })

    const meeting = await db.meetingRequest.findUnique({
      where: { id: draftId },
      include: { clientProfile: true },
    })
    if (!meeting) return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 })

    // ── Stage 1: Transcribe ───────────────────────────────────────────────────
    await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'TRANSCRIBING' } })

    const stt = getSTTProvider()
    const sttResult = await stt.transcribe(meeting.sourceFileUrl ?? '/demo/sample.mp3')

    // Upsert transcript
    const existing = await db.transcript.findUnique({ where: { meetingRequestId: draftId } })
    if (existing) {
      await db.transcript.update({
        where: { meetingRequestId: draftId },
        data: { rawJson: JSON.stringify(sttResult.segments) },
      })
    } else {
      await db.transcript.create({
        data: { meetingRequestId: draftId, rawJson: JSON.stringify(sttResult.segments) },
      })
    }

    await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'TRANSCRIBED' } })

    // ── Stage 2: LLM Analysis ─────────────────────────────────────────────────
    await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'GENERATING' } })

    const llm = getLLMProvider()
    // Build context object: segments + meeting metadata so the LLM mock
    // reflects the real title/date/location/company the user filled in the wizard
    const contextPayload = JSON.stringify({
      segments: sttResult.segments,
      context: {
        title: meeting.title,
        meetingDate: meeting.meetingDate?.toISOString(),
        location: meeting.location,
        meetingType: meeting.meetingType,
        complianceType: meeting.complianceType,
        region: meeting.region,
        company: meeting.clientProfile?.companyName,
      },
    })

    const [speakerAnalysis, chartData, complianceData] = await Promise.all([
      llm.generate('Analyze speaker participation and discussion topics.', contextPayload, 'speakers'),
      llm.generate('Generate chart visualization data for this meeting.', contextPayload, 'chart-data'),
      llm.generate('Audit CSE compliance against French Labor Code.', contextPayload, 'analyzer'),
    ])

    // ── Stage 3: Write PreviewResult ──────────────────────────────────────────
    const previewData = {
      speakerAnalysisJson: JSON.stringify(speakerAnalysis),
      chartDataJson: JSON.stringify(chartData),
      complianceJson: JSON.stringify(complianceData),
    }

    const existingPreview = await db.previewResult.findUnique({ where: { meetingRequestId: draftId } })
    if (existingPreview) {
      await db.previewResult.update({ where: { meetingRequestId: draftId }, data: previewData })
    } else {
      await db.previewResult.create({ data: { meetingRequestId: draftId, ...previewData } })
    }

    // Mark PREVIEWED
    await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'PREVIEWED' } })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PROCESS ERROR]', err)
    return NextResponse.json({ error: err.message ?? 'Processing failed.' }, { status: 500 })
  }
}
