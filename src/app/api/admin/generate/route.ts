import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getLLMProvider } from '@/lib/providers/llm'
import { isOutputAvailableForTier } from '@/lib/tiers'
import type { Tier, OutputType } from '@/lib/tiers'
import type { LLMSchema } from '@/lib/providers/types'

const OUTPUT_TYPE_TO_SCHEMA: Record<OutputType, LLMSchema> = {
  SPEAKER_ANALYSIS: 'speakers',
  REPORT_ANALYZER: 'analyzer',
  NUMERICAL_DATA: 'chart-data',
  MINUTES_REPORT: 'report',
  PPT_EXPORT: 'report',
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestId, outputType } = await req.json() as {
    requestId: string
    outputType: OutputType
  }

  if (!requestId || !outputType) {
    return NextResponse.json({ error: 'requestId and outputType required' }, { status: 400 })
  }

  const meeting = await db.meetingRequest.findUnique({
    where: { id: requestId },
    include: {
      transcript: true,
      clientProfile: true,
    },
  })

  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  // Tier gate
  const tier = meeting.tier as Tier
  if (!isOutputAvailableForTier(outputType, tier)) {
    return NextResponse.json({
      error: `${outputType} is not available for the ${tier} tier.`,
    }, { status: 403 })
  }

  // Get transcript — prefer edited, fallback to raw
  const transcript = meeting.transcript
  if (!transcript) {
    return NextResponse.json({ error: 'No transcript found. Run transcription first.' }, { status: 400 })
  }

  const transcriptJson = transcript.editedJson ?? transcript.rawJson
  const segments = JSON.parse(transcriptJson)

  // Find matching prompt template (exact tier match, or ALL fallback)
  const prompt = await db.promptTemplate.findFirst({
    where: {
      outputType,
      tier: { in: [tier, 'ALL'] },
    },
    orderBy: {
      // Prefer tier-specific over ALL
      tier: 'asc',
    },
  })

  const promptText = prompt?.promptText ?? `Generate a ${outputType} from this meeting transcript.`

  // Context: segments + meeting metadata
  const context = JSON.stringify({
    segments,
    context: {
      title: meeting.title,
      meetingDate: meeting.meetingDate,
      location: meeting.location,
      meetingType: meeting.meetingType,
      complianceType: meeting.complianceType,
      region: meeting.region,
      company: meeting.clientProfile.companyName,
    },
  })

  const schema = OUTPUT_TYPE_TO_SCHEMA[outputType]

  // Update status to GENERATING
  await db.meetingRequest.update({
    where: { id: requestId },
    data: { status: 'GENERATING' },
  })

  try {
    const llm = getLLMProvider()
    const output = await llm.generate(promptText, context, schema)

    // Upsert GeneratedOutput
    const existing = await db.generatedOutput.findFirst({
      where: { meetingRequestId: requestId, type: outputType },
    })

    let savedOutput
    if (existing) {
      if (existing.locked) {
        return NextResponse.json({ error: 'This output is locked and cannot be regenerated.' }, { status: 409 })
      }
      savedOutput = await db.generatedOutput.update({
        where: { id: existing.id },
        data: { contentJson: JSON.stringify(output) },
      })
    } else {
      savedOutput = await db.generatedOutput.create({
        data: {
          meetingRequestId: requestId,
          type: outputType,
          contentJson: JSON.stringify(output),
        },
      })
    }

    // Update status to TRANSCRIBED → IN_EDITING if MINUTES_REPORT
    await db.meetingRequest.update({
      where: { id: requestId },
      data: {
        status: outputType === 'MINUTES_REPORT' ? 'IN_EDITING' : 'TRANSCRIBED',
      },
    })

    await db.auditLog.create({
      data: {
        meetingRequestId: requestId,
        actorId: session.user.id,
        action: 'OUTPUT_GENERATED',
        metadata: JSON.stringify({ outputType, outputId: savedOutput.id }),
      },
    })

    return NextResponse.json({
      outputId: savedOutput.id,
      outputType,
      contentJson: savedOutput.contentJson,
    })
  } catch (err: any) {
    await db.meetingRequest.update({
      where: { id: requestId },
      data: { status: 'TRANSCRIBED' },
    })
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 })
  }
}
