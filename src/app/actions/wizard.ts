'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { getSTTProvider } from '@/lib/providers/stt'
import { getLLMProvider } from '@/lib/providers/llm'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// ─── Helper ────────────────────────────────────────────────────────────────

async function getClientProfile() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { clientProfile: true },
  })
  if (!user?.clientProfile) redirect('/login')
  return { user, profile: user.clientProfile }
}

// ─── Step 1: Create / update wizard draft ─────────────────────────────────

export async function createWizardDraft(formData: FormData) {
  const { profile } = await getClientProfile()

  const region = formData.get('region') as string
  const complianceType = formData.get('complianceType') as string
  const language = formData.get('language') as string || 'fr'

  const draft = await db.meetingRequest.create({
    data: {
      clientProfileId: profile.id,
      title: 'Untitled Meeting',
      meetingDate: new Date(),
      region,
      complianceType,
      language,
      tier: 'ESSENTIAL',
      status: 'DRAFT',
    },
  })

  // Store draft ID in a cookie so Step 2+ can pick it up after reload
  const cookieStore = await cookies()
  cookieStore.set('wizardDraftId', draft.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    sameSite: 'lax',
  })

  redirect(`/wizard/details?draftId=${draft.id}`)
}

// ─── Step 2: Update meeting metadata ──────────────────────────────────────

export async function updateWizardDetails(formData: FormData) {
  const draftId = formData.get('draftId') as string
  const title = formData.get('title') as string
  const location = formData.get('location') as string
  const meetingType = formData.get('meetingType') as string
  const meetingDate = formData.get('meetingDate') as string

  if (!draftId) redirect('/wizard/region')

  await db.meetingRequest.update({
    where: { id: draftId },
    data: {
      title,
      location,
      meetingType,
      meetingDate: new Date(meetingDate),
    },
  })

  redirect(`/wizard/upload?draftId=${draftId}`)
}

// ─── Step 3: Handle file upload ────────────────────────────────────────────

export async function uploadMeetingFile(formData: FormData) {
  const draftId = formData.get('draftId') as string
  const file = formData.get('file') as File

  if (!file || !draftId) {
    return { error: 'Missing file or draft ID.' }
  }

  // Validate size: 500MB max
  if (file.size > 500 * 1024 * 1024) {
    return { error: 'File too large. Maximum 500MB.' }
  }

  const allowed = [
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!allowed.includes(file.type)) {
    return { error: `File type "${file.type}" is not supported.` }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileUrl = await storage.save(buffer, file.name, 'uploads')

  await db.meetingRequest.update({
    where: { id: draftId },
    data: { sourceFileUrl: fileUrl },
  })

  return { success: true, fileUrl, draftId }
}

// ─── Processing: STT → LLM → PreviewResult ────────────────────────────────

export async function processUpload(draftId: string) {
  const meeting = await db.meetingRequest.findUnique({ where: { id: draftId } })
  if (!meeting) return { error: 'Meeting not found.' }

  // Mark as TRANSCRIBING
  await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'TRANSCRIBING' } })

  // Step 1: Transcribe with STT provider
  const stt = getSTTProvider()
  const sttResult = await stt.transcribe(meeting.sourceFileUrl ?? '/uploads/sample.mp3')

  // Save transcript
  const transcriptData = { rawJson: JSON.stringify(sttResult.segments) }
  const existing = await db.transcript.findUnique({ where: { meetingRequestId: draftId } })
  if (existing) {
    await db.transcript.update({ where: { meetingRequestId: draftId }, data: transcriptData })
  } else {
    await db.transcript.create({ data: { meetingRequestId: draftId, ...transcriptData } })
  }

  await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'TRANSCRIBED' } })

  // Step 2: Run LLM analysis
  await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'GENERATING' } })

  const llm = getLLMProvider()
  const context = sttResult.segments.map((s) => `[${s.speaker}]: ${s.text}`).join('\n')

  const [speakerAnalysis, chartData, complianceData] = await Promise.all([
    llm.generate('Analyze the speaker participation and discussion topics.', context, 'speakers'),
    llm.generate('Generate chart visualization data for this meeting.', context, 'chart-data'),
    llm.generate('Perform a French Labor Code CSE compliance audit.', context, 'analyzer'),
  ])

  // Write PreviewResult record
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

  // Mark as PREVIEWED
  await db.meetingRequest.update({ where: { id: draftId }, data: { status: 'PREVIEWED' } })

  return { success: true }
}
