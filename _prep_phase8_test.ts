import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { MockSTTProvider } from './src/lib/providers/stt/mock'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
const db = new PrismaClient({ adapter })

async function run() {
  // Get the QUOTED meeting (Logistics Review - PREMIUM tier)
  const quotedMeeting = await db.meetingRequest.findFirst({
    where: { status: 'QUOTED' },
    include: { transcript: true },
  })
  
  if (!quotedMeeting) {
    console.log('No QUOTED meeting found')
    return
  }

  console.log(`Preparing: "${quotedMeeting.title}" (${quotedMeeting.id})`)

  // Set to ADMIN_INTAKE first, then TRANSCRIBED
  await db.meetingRequest.update({
    where: { id: quotedMeeting.id },
    data: { status: 'ADMIN_INTAKE' },
  })

  // Run mock transcription
  const stt = new MockSTTProvider()
  const result = await stt.transcribe('/uploads/sample-audio.mp3')
  
  const existing = await db.transcript.findUnique({ where: { meetingRequestId: quotedMeeting.id } })
  if (existing) {
    await db.transcript.update({
      where: { meetingRequestId: quotedMeeting.id },
      data: { rawJson: JSON.stringify(result.segments), editedJson: null },
    })
  } else {
    await db.transcript.create({
      data: {
        meetingRequestId: quotedMeeting.id,
        rawJson: JSON.stringify(result.segments),
      },
    })
  }

  await db.meetingRequest.update({
    where: { id: quotedMeeting.id },
    data: { status: 'TRANSCRIBED' },
  })

  // Clean up any existing outputs for this meeting so tests are clean
  await db.generatedOutput.deleteMany({ where: { meetingRequestId: quotedMeeting.id } })

  // Also ensure the ESSENTIAL meeting has a transcript
  const essentialMeeting = await db.meetingRequest.findFirst({
    where: { tier: 'ESSENTIAL', sourceFileUrl: { not: null } },
    include: { transcript: true },
  })
  if (essentialMeeting && !essentialMeeting.transcript) {
    const r2 = await stt.transcribe('/uploads/sample-audio.mp3')
    await db.transcript.create({
      data: { meetingRequestId: essentialMeeting.id, rawJson: JSON.stringify(r2.segments) },
    })
    await db.meetingRequest.update({
      where: { id: essentialMeeting.id },
      data: { status: 'TRANSCRIBED' },
    })
  }

  console.log(`Done. Meeting "${quotedMeeting.title}" (${quotedMeeting.id}) now TRANSCRIBED`)
  console.log(`ESSENTIAL meeting: ${essentialMeeting?.id ?? 'no file'}`)
}

run().catch(console.error).finally(() => db.$disconnect())
